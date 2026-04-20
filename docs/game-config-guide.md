# RCAC Job Runner — Configuration Guide

This guide is for RCAC staff who manage the maintenance page. It covers every game-related field in `config.js` and how to use them.

---

## Quick summary

There are two game settings in `config.js`. Both games — **RCAC Job Runner** (Pac-Man) and **TRON Light Cycle** — are controlled by the same `showGame` flag:

| Field | Type | What it does |
[|------|------|--------------|]
| `showGame` | boolean | Shows or hides the game launch button on the page |
| `RCAC_CLUSTERS` | array of objects | Cluster cards revealed between game levels |

Everything else in `config.js` is unrelated to the game and is documented in the main maintenance page guide.

---

## `showGame`

```javascript
showGame: true,
```

- **`true`** — Two "Play" buttons appear below the maintenance announcement: one for **RCAC Job Runner** and one for **TRON Light Cycle**. Clicking either swaps the announcement card for that game.
- **`false`** — Both buttons are hidden and the announcement card is shown as normal. The game scripts are still loaded by the browser but neither game can start.

**When to use `false`:** When you want the announcement to be the only thing visible, or if the games are not appropriate for the current maintenance event.

**When to use `true`:** Any time you want to give users something to do while services are down. Both games become available simultaneously — there is no way to enable one without the other via config.

---

## `RCAC_CLUSTERS`

```javascript
RCAC_CLUSTERS: [
  {
    name: "Cluster Name",
    year: "20XX",
    specs: "N nodes · X cores · Y GB RAM per node",
    fact: "One memorable sentence about this system."
  },
  ...
],
```

This array drives the between-level "cluster reveal" screens. When a player finishes level 1, they see the entry at index 0. Level 2 reveals index 1, and so on. After the player has seen all entries, subsequent levels proceed without a reveal screen.

### Fields

| Field | Required | Description |
[|------|----------|-------------|]
| `name` | Yes | The cluster's official name — e.g. `"Anvil"`, `"Halcyon"` |
| `year` | Yes | The year the cluster went live — e.g. `"2021"`. Use `"20XX"` as a placeholder if unknown. |
| `specs` | Yes | A one-line hardware summary displayed under the name — e.g. `"1000 nodes · 128 cores · 256 GB RAM per node"` |
| `fact` | Yes | One sentence about the cluster — something memorable, historical, or interesting to researchers |

All four fields are required for each entry. If a field is empty, it will appear blank on screen.

### How many entries to add

You can add as many or as few entries as you like:

- **0 entries** — `RCAC_CLUSTERS: []` — The game still works, but there are no reveal screens between levels. The player just continues to the next level immediately.
- **4 entries** — The recommended default. RCAC has historically had 4–5 major clusters. Add one per cluster in chronological order, ending with Halcyon.
- **More than 4** — Supported. The game will show a reveal screen for every entry you add, in order. Good if RCAC adds new clusters in the future.

### Ordering convention

Entries should be in the order they came online, oldest first. This way the reveals feel like a timeline as the player progresses. Halcyon, being the newest cluster, should be the last entry.

### Example with real data

```javascript
RCAC_CLUSTERS: [
  {
    name: "Lear",
    year: "2007",
    specs: "264 nodes · 8 cores · 16 GB RAM per node",
    fact: "RCAC's first dedicated research cluster, supporting early computational science at Purdue."
  },
  {
    name: "Steele",
    year: "2010",
    specs: "572 nodes · 8 cores · 24 GB RAM per node",
    fact: "Named after a Purdue engineering professor; one of the first clusters to support large-scale MPI workloads at RCAC."
  },
  {
    name: "Anvil",
    year: "2021",
    specs: "1000 nodes · 128 cores · 256 GB RAM per node",
    fact: "NSF-funded system designed to support the entire national research community through ACCESS allocations."
  },
  {
    name: "Halcyon",
    year: "2025",
    specs: "N nodes · X cores · Y GB RAM per node",
    fact: "RCAC's newest and most powerful cluster to date."
  },
],
```

> **Note:** The cluster names, years, and specs above are illustrative examples. Ask a colleague in the HPC systems group for accurate data before publishing.

---

## Enabling and disabling the game for a maintenance event

### To show the game (normal maintenance)

```javascript
showGame: true,
```

Fill in `RCAC_CLUSTERS` with real cluster data before going live.

### To hide the game temporarily

```javascript
showGame: false,
```

The rest of the config (dates, announcement text, contact info) is unaffected.

### To run the game with no cluster reveals

```javascript
showGame: true,
RCAC_CLUSTERS: [],
```

---

## Audio files

The game needs audio files in the `audio/` folder next to `index.html`. These files are not controlled by `config.js` — they are loaded automatically whenever the game starts. If a file is missing, the game continues silently without an error.

Required files (both `.ogg` and `.mp3` formats for each):

| File stem | Plays when |
[|----------|------------|]
| `opening_song` | New level countdown starts |
| `die` | Player is caught by a ghost |
| `eatghost` | Player eats a vulnerable ghost |
| `eatpill` | Player eats a GPU Boost pill |
| `eating.short` | Background eating sound |

Both format pairs must be present. Browsers pick the format they support automatically.

---

## Full game section of `config.js` at a glance

```javascript
// ── Game ─────────────────────────────────────────────────
// Set showGame: true to display the "Play RCAC Job Runner" button.
// Set showGame: false to hide the game and show only the announcement.
showGame: true,

// One entry per level. Completing level N reveals RCAC_CLUSTERS[N-1].
// Add entries in chronological order, oldest cluster first.
// You can add or remove entries freely.
RCAC_CLUSTERS: [
  {
    name: "Cluster Name",
    year: "20XX",
    specs: "N nodes · X cores · Y GB RAM per node",
    fact: "One memorable sentence about this system."
  },
  // ... add more entries here ...
],
```

---

## Who to contact

If the game has a bug or you need to update the cluster data and are unsure of the correct values, reach out to the RCAC web team or the HPC systems group. The configuration file itself requires no programming knowledge — editing the values above is all that is needed.
