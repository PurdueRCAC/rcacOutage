# RCAC Games — Developer Guide

This document covers the architecture of both arcade games built into the maintenance page, how they integrate with the page structure, and how to extend or add games.

---

## File overview

| File | Role |
[|-----|------|]
| `index.html` | Declares the `#news-section` / game section swap structure and loads all scripts |
| `config.js` | Single source of truth — `showGame` flag + `RCAC_CLUSTERS` array |
| `js/main.js` | Wires all launch/back buttons; calls `window.rcacGameStart()` and `window.tronGameStart()` |
| `js/game.js` | Self-contained Pac-Man engine + HPC skin + cluster reveal system |
| `js/tron.js` | TRON Light Cycle engine — DOM-based, fullscreen |
| `css/style.css` | Game card, back bar, and launch button styles |
| `css/tron.css` | TRON-specific fullscreen layout and animation styles |
| `audio/` | Six audio files in both `.ogg` and `.mp3` formats (Pac-Man only) |

The page has zero build dependencies. Everything runs from a static file server or a local `file://` URL.

---

## How the game is loaded

`main.js` reads `window.MAINTENANCE_CONFIG.showGame`. When `true`:

1. It un-hides `#game-launch-bar` (the gold button inside `#news-section`).
2. A click on that button hides `#news-section`, shows `#game-section`, and calls `window.rcacGameStart()`.
3. `window.rcacGameStart()` (exported by `game.js`) checks the `gameInitialized` flag to prevent double-init, then calls `PACMAN.init(wrapper, './')` via a `setTimeout(fn, 0)` to yield to layout before sizing the canvas.
4. The back button reverses the swap. The game is not destroyed — it keeps running in the background, which is intentional (the player can return to the game).

```text
showGame: true
  → launch button visible
    → click → news hidden / game visible → rcacGameStart()
      → PACMAN.init(wrapper, './') → canvas created, audio loaded, loop started
```

---

## Game engine architecture

The engine is a self-invoking function that exposes nothing to the global scope except `window.rcacGameStart`. All internal state lives in closures.

### Module structure (top to bottom in `game.js`)

```text
Constants (NONE, UP, DOWN, LEFT, RIGHT, WAITING, PLAYING, …, CLUSTER_REVEAL)
Utilities  (deepClone, wrapText)
Pacman.Ghost    constructor
Pacman.User     constructor
Pacman.Map      constructor
Pacman.Audio    constructor
PACMAN          controller singleton (IIFE)
KEY             key-code map
Pacman.MAP      22×19 grid layout
Pacman.WALLS    vector wall definitions
Bootstrap       window.rcacGameStart
```

### State machine

The `PACMAN` controller tracks a single `state` variable. Valid states:

| Constant | Value | Description |
[|---------|-------|-------------|]
| `WAITING` | 5 | After death or game start — shows instructions overlay |
| `PAUSE` | 6 | Player pressed P — game loop still ticks but no movement |
| `PLAYING` | 7 | Normal gameplay |
| `COUNTDOWN` | 8 | 5-4-3-2-1 before `PLAYING` begins |
| `EATEN_PAUSE` | 9 | Brief freeze after eating a ghost |
| `DYING` | 10 | Death animation (2 seconds) |
| `CLUSTER_REVEAL` | 12 | Between-level overlay — no game logic runs |

Transitions go through `setState(nState)` which also sets `stateChanged = true`. The `mainLoop` function checks `stateChanged` to avoid redundant full redraws.

### Game loop

```javascript
timer = window.setInterval(mainLoop, 1000 / Pacman.FPS);   // 30 FPS
```

`mainLoop` runs every ~33 ms. It:

1. Returns immediately if `state === CLUSTER_REVEAL` (just redraws the overlay).
2. Increments `tick` (except during `PAUSE`).
3. Calls `map.drawPills(ctx)` for the pulsing pill animation.
4. Dispatches to per-state draw logic.
5. Always ends with `drawFooter()`.

### Coordinate system

The map is 19 columns × 22 rows of `blockSize`-pixel cells. `blockSize` is calculated at init:

```javascript
var blockSize = Math.floor(wrapper.offsetWidth / 19);
```

Internally, positions are stored in units of 1/10 of a block (so one block = 10 internal units). This gives sub-cell precision for smooth movement without floating-point drift.

Tunnel wrapping is hard-coded at row 10 (internal y = 100):

```javascript
if (pos.y === 100 && pos.x >= 190 && direction === RIGHT) { return { y: 100, x: -10 }; }
if (pos.y === 100 && pos.x <= -10 && direction === LEFT)  { return { y: 100, x: 190 }; }
```

### Map constants

```javascript
Pacman.WALL    = 0   // impassable
Pacman.BISCUIT = 1   // compute unit (dot) — 10 Core-Hours
Pacman.EMPTY   = 2   // open corridor
Pacman.BLOCK   = 3   // ghost cage interior
Pacman.PILL    = 4   // GPU Boost (power pill) — 50 Core-Hours
```

`Pacman.MAP` is the 22×19 source array. `Pacman.Map.reset()` calls `deepClone(Pacman.MAP)` to make a fresh working copy for each level. The `deepClone` utility handles the nested integer arrays; it is a purpose-built replacement for `Object.prototype.clone` (which polluted the prototype chain in the original engine).

### Dot count

The map has exactly **182 compute units** (biscuits). When `user.eaten` reaches 182, `game.completedLevel()` is called. If you edit the map layout, update this constant in `Pacman.User.move`:

```javascript
if (eaten === 182) { game.completedLevel(); }
```

### Ghost behaviour

Four ghosts are created at init with colours `['#FF0000', '#00FFDE', '#FFB8DE', '#FFB847']` (OOM Killer, Zombie Process, Segfault, Timeout). Each ghost is an independent closure (no shared mutable state). Ghost names are purely visual — they appear only in the user guide.

Ghosts move at different speeds depending on state:

- Normal: 2 units/tick
- Vulnerable (after GPU Boost): 1 unit/tick
- Hidden/returning (after being eaten): 4 units/tick

Vulnerability expires 8 seconds after `makeEatable()`. The ghost flashes white/blue during the last 3 seconds (when `secondsAgo(eatable) > 5`).

### Cluster reveal system

`completedLevel()` is called when all dots are eaten. It:

1. Reads `window.MAINTENANCE_CONFIG.RCAC_CLUSTERS[level - 1]`.
2. If an entry exists, stores it in `revealData`, sets `state = CLUSTER_REVEAL`, draws the overlay, and starts a 5-second `setTimeout` to auto-dismiss.
3. If no entry exists (player has passed all clusters), it proceeds directly to the next level.

The overlay is dismissed by any keypress (handled in `keyDown`) or the auto-dismiss timer, whichever fires first. A `revealDismissed` flag prevents double-processing.

`proceedAfterReveal()` resets the map, calls `user.newLevel()`, and starts the next level.

### Audio

`Pacman.Audio` is a minimal wrapper around the HTML5 `<audio>` element. It loads files sequentially (not in parallel) to avoid race conditions on slow connections.

Each file is loaded with three safety nets:

- `canplaythrough` event
- `error` event (proceeds even if the file is missing)
- 3-second `setTimeout` fallback

Audio files are resolved relative to the `root` argument passed to `PACMAN.init`. Currently `'./'` — meaning they must live in the `audio/` folder next to `index.html`.

Format detection:

```javascript
var ext = audioEl.canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'mp3';
```

Both formats must be present. The six required files:

| Key | Filename stem | Triggered when |
[|----|---------------|----------------|]
| `start` | `opening_song` | New level countdown starts |
| `die` | `die` | Player is caught by a dangerous ghost |
| `eatghost` | `eatghost` | Player eats a vulnerable ghost |
| `eatpill` | `eatpill` | Player eats a GPU Boost pill |
| `eating` | `eating.short` | (loaded but not yet wired to loop) |
| `eating2` | `eating.short` | Same file, second channel |

Sound toggle is stored in `localStorage['soundDisabled']` so the preference persists across page reloads.

### Footer and overlay rendering

The canvas is `blockSize * 19` wide and `blockSize * 22 + 50` tall. The extra 50px is the footer.

`drawFooter()` draws two rows:

- Row 1 (y = mazeBottom + 18): Pac-Man slot icons, Core-Hours score, Level counter, `[S] Sound: ON/OFF` indicator
- Row 2 (y = mazeBottom + 38): Arrow/key hint text

`drawInstructions()` draws a centered panel over the maze when `state === WAITING`. It scales with `blockSize`.

`drawReveal()` draws a full-canvas overlay when `state === CLUSTER_REVEAL`. It uses proportional coordinates (`h * 0.17`, etc.) so it scales to any canvas size.

`wrapText(ctx, text, cx, y, maxW, lh)` word-wraps a string into the canvas at center-aligned position `cx`.

---

## Adding a second game

The page is wired to support multiple independent games. The pattern:

### 1. Add a section and button pair to `index.html`

```html
<!-- In #news-section, after the existing game-launch-bar: -->
<div id="game2-launch-bar" style="display:none">
  <button id="game2-launch-btn" type="button">Play [Game Name]</button>
</div>

<!-- After #game-section: -->
<section id="game2-section" class="card game-card" aria-label="[Game Name]" style="display:none">
  <div id="game-back-bar2">
    <button id="game2-back-btn" type="button">&#8592; Back to Announcement</button>
  </div>
  <div id="game2-canvas-wrapper"></div>
</section>
```

### 2. Export a start function from the new game script

```javascript
window.rcacGame2Start = function () { /* init logic */ };
```

### 3. Add a flag to `config.js`

```javascript
showGame2: true,
```

### 4. Wire the buttons in `main.js`

```javascript
if (cfg.showGame2) {
  var launch2Bar = el('game2-launch-bar');
  var launch2Btn = el('game2-launch-btn');
  var back2Btn   = el('game2-back-btn');
  var game2Section = el('game2-section');
  var newsSection  = el('news-section');

  if (launch2Bar) launch2Bar.style.display = '';
  if (launch2Btn) {
    launch2Btn.addEventListener('click', function () {
      if (newsSection)  newsSection.style.display  = 'none';
      if (game2Section) game2Section.style.display = '';
      if (window.rcacGame2Start) { window.rcacGame2Start(); }
    });
  }
  if (back2Btn) {
    back2Btn.addEventListener('click', function () {
      if (game2Section) game2Section.style.display = 'none';
      if (newsSection)  newsSection.style.display  = '';
    });
  }
}
```

### 5. Load the new script in `index.html`

```html
<script src="js/game2.js"></script>
```

---

## Editing the maze layout

`Pacman.MAP` is a 22-row × 19-column array of integers (`0`=wall, `1`=dot, `2`=empty, `3`=cage, `4`=pill).

`Pacman.WALLS` is a parallel array of SVG-like vector paths used to draw the blue wall outlines. If you change `Pacman.MAP`, you must also update `Pacman.WALLS` to match, otherwise the visual walls will not line up with the collision geometry.

The ghost cage is the 3×3 block of `3` cells near the centre of the map (rows 9-11, cols 8-10).

---

## Responsive sizing

Canvas width is fixed to `wrapper.offsetWidth` at init time. If the page is resized after the game starts, the canvas does not resize — the game loop continues at the original size. This is intentional; resizing mid-game would require re-deriving all positions.

The `max-width: 100%` rule on `#game-canvas-wrapper canvas` prevents horizontal scroll on narrow viewports by letting the browser scale the canvas element down visually (while the internal pixel buffer stays at its original resolution).

---

## Dependencies

None. The Pac-Man game requires only:

- A modern browser with HTML5 Canvas support (`canvas.getContext('2d')`)
- The `audio/` folder with the six sound files in `.ogg` and `.mp3` formats

No CDN, no npm, no build step.

---

## TRON Light Cycle — architecture

The TRON game is architecturally different from the Pac-Man game: it renders with **DOM elements** rather than a canvas, and it takes over the **full browser viewport** rather than a fixed-width card.

### Rendering approach

Each grid cell is a `10px × 10px` `<div>`. The player trail, AI trail, barriers, and light cycles are all individual positioned `<div>` elements inside `#gameArea`. This makes the visual effects (shatter fragments, spark particles, shockwave rings) straightforward CSS animations on dynamically created elements.

No `<canvas>` is used. There is no pixel buffer — layout is delegated entirely to the browser.

### Fullscreen layout

`css/tron.css` overrides the `.card` layout for `#tron-section`:

```css
#tron-section {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100vw; height: 100vh;
    z-index: 10000;
}
```

This covers the entire viewport above everything else. The back button bar (`.tron-back-bar`) is a fixed strip at the top of `#tron-container`, and `#gameArea` fills the remaining height below it.

Grid dimensions are calculated from `#gameArea` pixel dimensions at start time:

```javascript
let gameWidth  = Math.floor(gameArea.offsetWidth  / gridSize);  // gridSize = 10
let gameHeight = Math.floor(gameArea.offsetHeight / gridSize);
```

Fallbacks of 80 × 50 apply if the element has not yet been painted.

### Tron: Game loop

```javascript
let gameInterval = setInterval(gameLoop, gameSpeed);  // gameSpeed starts at 30 ms
```

`gameLoop` runs every `gameSpeed` ms. It:

1. Calculates the next position for both the player and AI.
2. Runs collision detection (boundaries, own trail, AI trail, barriers, head-on, cut-off).
3. Marks trails in the `grid` 2D array (`2` = player, `3` = AI).
4. Appends trail `<div>` elements to `#gameArea`.
5. Updates scores and triggers visual effects as needed.

When the AI is defeated, `clearInterval` / `setInterval` restarts the loop at the reduced `gameSpeed` (min 10 ms).

### AI behaviour

The AI makes decisions inside `makeAIDecision()` each tick:

- **Emergency turn**: if the next cell is blocked, pick the direction with the most open space (35% chance of random suboptimal choice instead).
- **Random impulse**: 5% chance per tick to turn to a random valid direction regardless of need.
- **Periodic turn**: every 0.5–2 seconds (random interval), 55% chance to reassess — either random direction or toward the player.

This intentional imperfection keeps the AI beatable while still providing challenge.

### Lifecycle functions

| Function | Purpose |
| --- | --- |
| `window.tronGameStart()` | Full init — clears `#gameArea`, resets all state, starts the loop |
| `window.tronGameStop()` | Clears the interval, removes the `keydown` listener, nulls `window.tronGameState` |

`tronGameStart` calls `tronGameStop` at the top, so calling it again (e.g. after game over) is safe — it cleans up the previous run first.

`main.js` calls `tronGameStop` when the back button is clicked to halt the loop before hiding the section.

### Visual effects

All effects are created as temporary `<div>` elements appended to `#gameArea` and removed via `setTimeout` after their animation completes.

| Effect | Trigger | Duration |
| --- | --- | --- |
| Cycle shatter (12 fragments + 8 sparks) | Either cycle destroyed | 1500 ms |
| Shockwave ring | Cycle destroyed or speed increase | 500 ms |
| Screen flash | Cycle destroyed or speed increase | 150–200 ms |
| Afterburner particle burst (12 particles) | Speed increases after AI defeat | 600 ms |

### No audio, no config fields

The TRON game has no sound effects and does not read from `RCAC_CLUSTERS`. It is always available whenever `showGame: true` is set in `config.js`. There is no separate toggle.
