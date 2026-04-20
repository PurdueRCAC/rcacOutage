/*
 * RCAC Job Runner — HPC-Themed Pac-Man
 * Adapted from github.com/daleharvey/pacman (MIT License)
 *
 * HPC skin:
 *   Pac-Man  → Job Runner
 *   Ghosts   → OOM Killer · Zombie Process · Segfault · Timeout
 *   Dots     → Compute units
 *   Pills    → GPU Boost (makes errors vulnerable)
 *   Score    → Core-Hours
 *   Lives    → Job Slots
 *
 * Between-level cluster reveals read from window.MAINTENANCE_CONFIG.RCAC_CLUSTERS
 * Vanilla JS — no jQuery or Modernizr required
 */
(function () {
  'use strict';

  /* ── Direction / State constants ─────────────────────────── */
  var NONE           = 4,
      UP             = 3,
      LEFT           = 2,
      DOWN           = 1,
      RIGHT          = 11,
      WAITING        = 5,
      PAUSE          = 6,
      PLAYING        = 7,
      COUNTDOWN      = 8,
      EATEN_PAUSE    = 9,
      DYING          = 10,
      CLUSTER_REVEAL = 12;

  var Pacman = {};
  Pacman.FPS = 30;

  var GHOST_COLORS = ['#FF0000', '#00FFDE', '#FFB8DE', '#FFB847'];

  /* ── Utilities ──────────────────────────────────────────── */
  function deepClone(src) {
    if (Array.isArray(src)) { return src.map(deepClone); }
    return src;
  }

  function wrapText(ctx, text, cx, y, maxW, lh) {
    var words = text.split(' '), line = '';
    for (var i = 0; i < words.length; i++) {
      var test = line + words[i] + ' ';
      if (ctx.measureText(test).width > maxW && i > 0) {
        ctx.fillText(line.trim(), cx, y);
        line = words[i] + ' ';
        y += lh;
      } else {
        line = test;
      }
    }
    if (line.trim()) { ctx.fillText(line.trim(), cx, y); }
  }

  /* ── Pacman.Ghost ───────────────────────────────────────── */
  Pacman.Ghost = function (game, map, colour) {
    var position = null, direction = null, eatable = null, eaten = null, due = null;

    function getNewCoord(dir, current) {
      var speed  = isVunerable() ? 1 : isHidden() ? 4 : 2,
          xSpeed = (dir === LEFT && -speed || dir === RIGHT && speed || 0),
          ySpeed = (dir === DOWN && speed  || dir === UP   && -speed || 0);
      return { x: addBounded(current.x, xSpeed), y: addBounded(current.y, ySpeed) };
    }

    function addBounded(x1, x2) {
      var rem = x1 % 10, result = rem + x2;
      if (rem !== 0 && result > 10) { return x1 + (10 - rem); }
      if (rem > 0   && result < 0)  { return x1 - rem; }
      return x1 + x2;
    }

    function isVunerable() { return eatable !== null; }
    function isDangerous()  { return eaten === null; }
    function isHidden()     { return eatable === null && eaten !== null; }

    function getRandomDirection() {
      var moves = (direction === LEFT || direction === RIGHT) ? [UP, DOWN] : [LEFT, RIGHT];
      return moves[Math.floor(Math.random() * 2)];
    }

    function reset() {
      eaten = null; eatable = null;
      position  = { x: 90, y: 80 };
      direction = getRandomDirection();
      due       = getRandomDirection();
    }

    function onWholeSquare(x) { return x % 10 === 0; }

    function oppositeDirection(dir) {
      return dir === LEFT  && RIGHT ||
             dir === RIGHT && LEFT  ||
             dir === UP    && DOWN  || UP;
    }

    function makeEatable() { direction = oppositeDirection(direction); eatable = game.getTick(); }
    function eat()         { eatable = null; eaten = game.getTick(); }
    function pointToCoord(x) { return Math.round(x / 10); }

    function nextSquare(x, dir) {
      var rem = x % 10;
      if (rem === 0)                         { return x; }
      if (dir === RIGHT || dir === DOWN) { return x + (10 - rem); }
      return x - rem;
    }

    function onGridSquare(pos) { return onWholeSquare(pos.y) && onWholeSquare(pos.x); }
    function secondsAgo(tick)  { return (game.getTick() - tick) / Pacman.FPS; }

    function getColour() {
      if (eatable) {
        if (secondsAgo(eatable) > 5) { return game.getTick() % 20 > 10 ? '#FFFFFF' : '#0000BB'; }
        return '#0000BB';
      }
      if (eaten) { return '#222'; }
      return colour;
    }

    function draw(ctx) {
      var s    = map.blockSize,
          top  = (position.y / 10) * s,
          left = (position.x / 10) * s;

      if (eatable && secondsAgo(eatable) > 8) { eatable = null; }
      if (eaten   && secondsAgo(eaten)   > 3) { eaten   = null; }

      var tl   = left + s,
          base = top + s - 3,
          inc  = s / 10,
          high = game.getTick() % 10 > 5 ?  3 : -3,
          low  = game.getTick() % 10 > 5 ? -3 :  3;

      ctx.fillStyle = getColour();
      ctx.beginPath();
      ctx.moveTo(left, base);
      ctx.quadraticCurveTo(left,     top, left + s / 2, top);
      ctx.quadraticCurveTo(left + s, top, left + s,     base);
      ctx.quadraticCurveTo(tl - inc,       base + high, tl - inc * 2,  base);
      ctx.quadraticCurveTo(tl - inc * 3,   base + low,  tl - inc * 4,  base);
      ctx.quadraticCurveTo(tl - inc * 5,   base + high, tl - inc * 6,  base);
      ctx.quadraticCurveTo(tl - inc * 7,   base + low,  tl - inc * 8,  base);
      ctx.quadraticCurveTo(tl - inc * 9,   base + high, tl - inc * 10, base);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = '#FFF';
      ctx.arc(left + 6,       top + 6, s / 6, 0, 300, false);
      ctx.arc(left + s - 6,   top + 6, s / 6, 0, 300, false);
      ctx.closePath();
      ctx.fill();

      var f   = s / 12;
      var off = {};
      off[RIGHT] = [f, 0]; off[LEFT] = [-f, 0];
      off[UP]    = [0, -f]; off[DOWN] = [0, f];

      ctx.beginPath();
      ctx.fillStyle = '#000';
      ctx.arc(left + 6     + off[direction][0], top + 6 + off[direction][1], s / 15, 0, 300, false);
      ctx.arc(left + s - 6 + off[direction][0], top + 6 + off[direction][1], s / 15, 0, 300, false);
      ctx.closePath();
      ctx.fill();
    }

    function pane(pos) {
      if (pos.y === 100 && pos.x >= 190 && direction === RIGHT) { return { y: 100, x: -10 }; }
      if (pos.y === 100 && pos.x <= -10 && direction === LEFT)  { return { y: 100, x: 190 }; }
      return false;
    }

    function move(ctx) {
      var oldPos = position, onGrid = onGridSquare(position), npos = null;

      if (due !== direction) {
        npos = getNewCoord(due, position);
        if (onGrid && map.isFloorSpace({
              y: pointToCoord(nextSquare(npos.y, due)),
              x: pointToCoord(nextSquare(npos.x, due)) })) {
          direction = due;
        } else {
          npos = null;
        }
      }

      if (npos === null) { npos = getNewCoord(direction, position); }

      if (onGrid && map.isWallSpace({
            y: pointToCoord(nextSquare(npos.y, direction)),
            x: pointToCoord(nextSquare(npos.x, direction)) })) {
        due = getRandomDirection();
        return move(ctx);
      }

      position = npos;
      var tmp = pane(position);
      if (tmp) { position = tmp; }
      due = getRandomDirection();

      return { 'new': position, 'old': oldPos };
    }

    return {
      eat: eat, isVunerable: isVunerable, isDangerous: isDangerous,
      makeEatable: makeEatable, reset: reset, move: move, draw: draw
    };
  };

  /* ── Pacman.User ────────────────────────────────────────── */
  Pacman.User = function (game, map) {
    var position = null, direction = null, eaten = null,
        due = null, lives = null, score = 0;

    var keyMap = {};
    keyMap[KEY.ARROW_LEFT]  = LEFT;
    keyMap[KEY.ARROW_UP]    = UP;
    keyMap[KEY.ARROW_RIGHT] = RIGHT;
    keyMap[KEY.ARROW_DOWN]  = DOWN;

    function addScore(n) {
      score += n;
      if (score >= 10000 && score - n < 10000) { lives += 1; }
    }
    function theScore()  { return score; }
    function loseLife()  { lives -= 1; }
    function getLives()  { return lives; }
    function initUser()  { score = 0; lives = 3; newLevel(); }
    function newLevel()  { resetPosition(); eaten = 0; }
    function resetPosition() { position = { x: 90, y: 120 }; direction = LEFT; due = LEFT; }
    function reset()     { initUser(); resetPosition(); }

    function keyDown(e) {
      if (typeof keyMap[e.keyCode] !== 'undefined') {
        due = keyMap[e.keyCode];
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      return true;
    }

    function getNewCoord(dir, current) {
      return {
        x: current.x + (dir === LEFT && -2 || dir === RIGHT && 2 || 0),
        y: current.y + (dir === DOWN && 2  || dir === UP   && -2 || 0)
      };
    }

    function onWholeSquare(x) { return x % 10 === 0; }
    function pointToCoord(x)  { return Math.round(x / 10); }

    function nextSquare(x, dir) {
      var rem = x % 10;
      if (rem === 0)                         { return x; }
      if (dir === RIGHT || dir === DOWN) { return x + (10 - rem); }
      return x - rem;
    }

    function next(pos, dir) {
      return { y: pointToCoord(nextSquare(pos.y, dir)), x: pointToCoord(nextSquare(pos.x, dir)) };
    }

    function onGridSquare(pos) { return onWholeSquare(pos.y) && onWholeSquare(pos.x); }

    function isOnSamePlane(d1, d2) {
      return ((d1 === LEFT || d1 === RIGHT) && (d2 === LEFT  || d2 === RIGHT)) ||
             ((d1 === UP   || d1 === DOWN)  && (d2 === UP    || d2 === DOWN));
    }

    function move(ctx) {
      var npos = null, nextWhole = null, oldPosition = position, block = null;

      if (due !== direction) {
        npos = getNewCoord(due, position);
        if (isOnSamePlane(due, direction) ||
            (onGridSquare(position) && map.isFloorSpace(next(npos, due)))) {
          direction = due;
        } else {
          npos = null;
        }
      }

      if (npos === null) { npos = getNewCoord(direction, position); }
      if (onGridSquare(position) && map.isWallSpace(next(npos, direction))) { direction = NONE; }
      if (direction === NONE) { return { 'new': position, 'old': position }; }

      if (npos.y === 100 && npos.x >= 190 && direction === RIGHT) { npos = { y: 100, x: -10 }; }
      if (npos.y === 100 && npos.x <= -12 && direction === LEFT)  { npos = { y: 100, x: 190 }; }

      position  = npos;
      nextWhole = next(position, direction);
      block     = map.block(nextWhole);

      if ((isMidSquare(position.y) || isMidSquare(position.x)) &&
          (block === Pacman.BISCUIT || block === Pacman.PILL)) {
        map.setBlock(nextWhole, Pacman.EMPTY);
        addScore(block === Pacman.BISCUIT ? 10 : 50);
        eaten += 1;
        if (eaten === 182)          { game.completedLevel(); }
        if (block === Pacman.PILL)  { game.eatenPill(); }
      }

      return { 'new': position, 'old': oldPosition };
    }

    function isMidSquare(x) { var rem = x % 10; return rem > 3 || rem < 7; }

    function calcAngle(dir, pos) {
      if (dir === RIGHT && pos.x % 10 < 5) { return { start: 0.25, end: 1.75, direction: false }; }
      if (dir === DOWN  && pos.y % 10 < 5) { return { start: 0.75, end: 2.25, direction: false }; }
      if (dir === UP    && pos.y % 10 < 5) { return { start: 1.25, end: 1.75, direction: true  }; }
      if (dir === LEFT  && pos.x % 10 < 5) { return { start: 0.75, end: 1.25, direction: true  }; }
      return { start: 0, end: 2, direction: false };
    }

    function drawDead(ctx, amount) {
      var size = map.blockSize, half = size / 2;
      if (amount >= 1) { return; }
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      ctx.moveTo(((position.x / 10) * size) + half, ((position.y / 10) * size) + half);
      ctx.arc(((position.x / 10) * size) + half, ((position.y / 10) * size) + half,
              half, 0, Math.PI * 2 * amount, true);
      ctx.fill();
    }

    function draw(ctx) {
      var s = map.blockSize, angle = calcAngle(direction, position);
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      ctx.moveTo(((position.x / 10) * s) + s / 2, ((position.y / 10) * s) + s / 2);
      ctx.arc(((position.x / 10) * s) + s / 2, ((position.y / 10) * s) + s / 2,
              s / 2, Math.PI * angle.start, Math.PI * angle.end, angle.direction);
      ctx.fill();
    }

    initUser();

    return {
      draw: draw, drawDead: drawDead, loseLife: loseLife, getLives: getLives,
      addScore: addScore, theScore: theScore, keyDown: keyDown,
      move: move, newLevel: newLevel, reset: reset, resetPosition: resetPosition
    };
  };

  /* ── Pacman.Map ─────────────────────────────────────────── */
  Pacman.Map = function (size) {
    var height = null, width = null, blockSize = size, pillSize = 0, map = null;

    function withinBounds(y, x) { return y >= 0 && y < height && x >= 0 && x < width; }
    function isWall(pos) { return withinBounds(pos.y, pos.x) && map[pos.y][pos.x] === Pacman.WALL; }

    function isFloorSpace(pos) {
      if (!withinBounds(pos.y, pos.x)) { return false; }
      var p = map[pos.y][pos.x];
      return p === Pacman.EMPTY || p === Pacman.BISCUIT || p === Pacman.PILL;
    }

    function drawWall(ctx) {
      var i, j, p, line;
      ctx.strokeStyle = '#0000FF';
      ctx.lineWidth   = 5;
      ctx.lineCap     = 'round';
      for (i = 0; i < Pacman.WALLS.length; i++) {
        line = Pacman.WALLS[i];
        ctx.beginPath();
        for (j = 0; j < line.length; j++) {
          p = line[j];
          if (p.move)  { ctx.moveTo(p.move[0] * blockSize,  p.move[1] * blockSize); }
          if (p.line)  { ctx.lineTo(p.line[0] * blockSize,  p.line[1] * blockSize); }
          if (p.curve) {
            ctx.quadraticCurveTo(p.curve[0] * blockSize, p.curve[1] * blockSize,
                                 p.curve[2] * blockSize, p.curve[3] * blockSize);
          }
        }
        ctx.stroke();
      }
    }

    function reset() {
      map    = deepClone(Pacman.MAP);
      height = map.length;
      width  = map[0].length;
    }

    function block(pos)           { return map[pos.y][pos.x]; }
    function setBlock(pos, type)  { map[pos.y][pos.x] = type; }

    function drawPills(ctx) {
      if (++pillSize > 30) { pillSize = 0; }
      var i, j;
      for (i = 0; i < height; i++) {
        for (j = 0; j < width; j++) {
          if (map[i][j] === Pacman.PILL) {
            ctx.beginPath();
            ctx.fillStyle = '#000';
            ctx.fillRect(j * blockSize, i * blockSize, blockSize, blockSize);
            ctx.fillStyle = '#FFF';
            ctx.arc(j * blockSize + blockSize / 2, i * blockSize + blockSize / 2,
                    Math.abs(5 - (pillSize / 3)), 0, Math.PI * 2, false);
            ctx.fill();
            ctx.closePath();
          }
        }
      }
    }

    function draw(ctx) {
      var i, j;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width * blockSize, height * blockSize);
      drawWall(ctx);
      for (i = 0; i < height; i++) {
        for (j = 0; j < width; j++) { drawBlock(i, j, ctx); }
      }
    }

    function drawBlock(y, x, ctx) {
      var layout = map[y][x];
      if (layout === Pacman.PILL) { return; }
      ctx.beginPath();
      if (layout === Pacman.EMPTY || layout === Pacman.BLOCK || layout === Pacman.BISCUIT) {
        ctx.fillStyle = '#000';
        ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
        if (layout === Pacman.BISCUIT) {
          ctx.fillStyle = '#FFF';
          ctx.fillRect(x * blockSize + (blockSize / 2.5), y * blockSize + (blockSize / 2.5),
                       blockSize / 6, blockSize / 6);
        }
      }
      ctx.closePath();
    }

    reset();

    return {
      draw: draw, drawBlock: drawBlock, drawPills: drawPills,
      block: block, setBlock: setBlock, reset: reset,
      isWallSpace: isWall, isFloorSpace: isFloorSpace,
      height: height, width: width, blockSize: blockSize
    };
  };

  /* ── Pacman.Audio ───────────────────────────────────────── */
  Pacman.Audio = function (game) {
    var files = {}, endEvents = {}, progressEvents = {}, playing = [];

    function load(name, path, cb) {
      var f = files[name] = document.createElement('audio');
      var done = false;

      function complete() {
        if (done) { return; }
        done = true;
        f.removeEventListener('canplaythrough', complete, true);
        f.removeEventListener('error', complete, true);
        if (typeof cb === 'function') { cb(); }
      }

      progressEvents[name] = complete;
      f.addEventListener('canplaythrough', complete, true);
      f.addEventListener('error', complete, true); // proceed even if file fails to load
      f.setAttribute('preload', 'auto');
      f.setAttribute('src', path);
      // Fallback: proceed after 3 s even if neither event fires
      setTimeout(complete, 3000);
    }

    function disableSound() {
      for (var i = 0; i < playing.length; i++) {
        files[playing[i]].pause();
        files[playing[i]].currentTime = 0;
      }
      playing = [];
    }

    function ended(name) {
      var tmp = [], found = false;
      files[name].removeEventListener('ended', endEvents[name], true);
      for (var i = 0; i < playing.length; i++) {
        if (!found && playing[i] === name) { found = true; }
        else { tmp.push(playing[i]); }
      }
      playing = tmp;
    }

    function play(name) {
      if (!game.soundDisabled() && files[name]) {
        endEvents[name] = function () { ended(name); };
        playing.push(name);
        files[name].addEventListener('ended', endEvents[name], true);
        files[name].play().catch(function () {});
      }
    }

    function pause()  { for (var i = 0; i < playing.length; i++) { if (files[playing[i]]) { files[playing[i]].pause(); } } }
    function resume() { for (var i = 0; i < playing.length; i++) { if (files[playing[i]]) { files[playing[i]].play().catch(function(){}); } } }

    return { disableSound: disableSound, load: load, play: play, pause: pause, resume: resume };
  };

  /* ── PACMAN main controller ─────────────────────────────── */
  var PACMAN = (function () {

    var state = WAITING, audio = null, ghosts = [], eatenCount = 0;
    var level = 0, tick = 0, ghostPos, userPos;
    var stateChanged = true, timerStart = null, lastTime = 0;
    var ctx = null, timer = null, map = null, user = null, stored = null, canvas = null;

    // Cluster reveal state
    var revealData = null, revealLevelNum = 0, revealDismissed = false, revealTimer = null;

    function getTick()       { return tick; }
    function soundDisabled() {
      try { return localStorage['soundDisabled'] === 'true'; } catch (e) { return false; }
    }

    /* ── Dialogs ── */
    function dialog(text) {
      var bs = map.blockSize;
      ctx.fillStyle = '#FFFF00';
      ctx.font      = Math.max(12, Math.floor(bs * 0.8)) + 'px sans-serif';
      var w = ctx.measureText(text).width;
      ctx.fillText(text,
        (map.width * bs - w) / 2,
        (map.height * bs) / 2);
    }

    function drawScore(text, position) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font      = '12px sans-serif';
      ctx.fillText(text,
        (position['new'].x / 10) * map.blockSize,
        ((position['new'].y + 5) / 10) * map.blockSize);
    }

    /* ── Footer ── */
    function drawFooter() {
      var bs      = map.blockSize;
      var topLeft = map.height * bs;
      var W       = map.width * bs;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, topLeft, W, 50);

      // Thin gold rule at top of footer
      ctx.fillStyle = '#cfb991';
      ctx.fillRect(0, topLeft, W, 1);

      // ── Row 1: Job slots · Core-Hours · Level · Sound ──
      var r1 = topLeft + 18;
      var slotR = Math.min(7, Math.floor(bs * 0.35));

      // Job Slot indicators (lives)
      for (var i = 0, len = user.getLives(); i < len; i++) {
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.moveTo(8 + (slotR * 2.4 * i) + slotR, topLeft + 8 + slotR);
        ctx.arc(8 + (slotR * 2.4 * i) + slotR, topLeft + 8 + slotR,
                slotR, Math.PI * 0.25, Math.PI * 1.75, false);
        ctx.fill();
      }

      // Core-Hours
      ctx.fillStyle = '#cfb991';
      ctx.font      = '13px sans-serif';
      ctx.fillText('Core-Hours: ' + user.theScore(), bs * 3.5, r1);

      // Level (right-aligned, leaving room for sound indicator)
      ctx.textAlign = 'right';
      ctx.fillText('Level: ' + level, W - 110, r1);

      // Sound indicator
      var soundOn = !soundDisabled();
      ctx.fillStyle = soundOn ? '#4dff4d' : '#ff5555';
      ctx.font      = 'bold 12px sans-serif';
      ctx.fillText('[S] Sound: ' + (soundOn ? 'ON ' : 'OFF'), W - 4, r1);
      ctx.textAlign = 'left';

      // ── Row 2: Key hints ──
      var r2 = topLeft + 38;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font      = '10px sans-serif';
      ctx.fillText('\u2191 \u2190 \u2193 \u2192  Move    \u00b7    N  New Game    \u00b7    P  Pause / Resume    \u00b7    S  Toggle Sound', 4, r2);
    }

    /* ── Instructions overlay (shown in WAITING state) ── */
    function drawInstructions() {
      var w  = canvas.width,
          bs = map.blockSize;
      // vertically centered in the maze area (exclude footer)
      var mazeH = map.height * bs;
      var bx = w * 0.12, bw = w * 0.76;
      var bh = Math.min(mazeH * 0.55, 200);
      var by = (mazeH - bh) / 2;

      // Panel background
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(bx, by, bw, bh);

      // Gold border
      ctx.strokeStyle = '#cfb991';
      ctx.lineWidth   = 2;
      ctx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);

      var cx   = w / 2;
      var fs   = Math.max(11, Math.floor(bs * 0.55));
      var lh   = Math.max(15, Math.floor(fs * 1.45));

      ctx.textAlign = 'center';

      // Title
      ctx.fillStyle = '#cfb991';
      ctx.font      = 'bold ' + Math.max(13, Math.floor(bs * 0.7)) + 'px sans-serif';
      ctx.fillText('RCAC Job Runner', cx, by + bh * 0.22);

      // Controls
      ctx.font = fs + 'px sans-serif';
      var rows = [
        ['\u2191 \u2190 \u2193 \u2192', '\u00a0 \u00a0 \u00a0 Move the job runner'],
        ['N',                           '\u00a0Start a new game'],
        ['P',                           'Pause / Resume'],
        ['S',                           '\u00a0 \u00a0 \u00a0 Toggle sound on / off'],
      ];
      var startY = by + bh * 0.42;
      rows.forEach(function (row, idx) {
        var y = startY + idx * lh;
        ctx.fillStyle = '#cfb991';
        ctx.fillText(row[0], cx - bw * 0.08, y);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(row[1], cx + bw * 0.15, y);
      });

      ctx.textAlign = 'left';
    }

    /* ── Cluster reveal overlay ── */
    function drawReveal() {
      if (!revealData) { return; }
      var w   = canvas.width,
          h   = canvas.height,
          pad = w * 0.08,
          bs  = Math.floor(w * 0.032);

      // Backdrop
      ctx.fillStyle = 'rgba(0,0,0,0.93)';
      ctx.fillRect(0, 0, w, h);

      // Gold top rule
      ctx.fillStyle = '#cfb991';
      ctx.fillRect(pad, h * 0.08, w - pad * 2, 2);

      // "✓ Level N Complete"
      ctx.fillStyle = '#5cb85c';
      ctx.font      = 'bold ' + Math.max(13, bs) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u2713  Level ' + revealLevelNum + ' Complete', w / 2, h * 0.17);

      // Cluster name
      ctx.fillStyle = '#cfb991';
      ctx.font      = 'bold ' + Math.max(20, Math.floor(bs * 2)) + 'px sans-serif';
      ctx.fillText(revealData.name, w / 2, h * 0.31);

      // Year
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font      = Math.max(13, Math.floor(bs * 1.1)) + 'px sans-serif';
      ctx.fillText(revealData.year, w / 2, h * 0.41);

      // Specs
      ctx.fillStyle = '#8ab4e8';
      ctx.font      = Math.max(11, bs) + 'px sans-serif';
      ctx.fillText(revealData.specs, w / 2, h * 0.52);

      // Thin divider
      ctx.strokeStyle = 'rgba(207,185,145,0.25)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(pad * 2, h * 0.58);
      ctx.lineTo(w - pad * 2, h * 0.58);
      ctx.stroke();

      // Fact (word-wrapped)
      ctx.fillStyle = '#ffffff';
      ctx.font      = 'italic ' + Math.max(11, bs) + 'px sans-serif';
      wrapText(ctx,
        '\u201C' + revealData.fact + '\u201D',
        w / 2, h * 0.67, w - pad * 3, Math.max(16, Math.floor(bs * 1.3)));

      // Gold bottom rule
      ctx.fillStyle = '#cfb991';
      ctx.fillRect(pad, h * 0.88, w - pad * 2, 2);

      // Continue prompt
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font      = Math.max(10, Math.floor(bs * 0.85)) + 'px sans-serif';
      ctx.fillText('Press any key or wait 5 s to continue', w / 2, h * 0.94);

      ctx.textAlign = 'left'; // reset
    }

    function proceedAfterReveal() {
      if (revealDismissed) { return; }
      revealDismissed = true;
      if (revealTimer) { clearTimeout(revealTimer); revealTimer = null; }
      map.reset();
      user.newLevel();
      startLevel();
    }

    /* ── Level management ── */
    function startLevel() {
      user.resetPosition();
      for (var i = 0; i < ghosts.length; i++) { ghosts[i].reset(); }
      audio.play('start');
      timerStart = tick;
      setState(COUNTDOWN);
    }

    function startNewGame() {
      setState(WAITING);
      level = 1;
      user.reset();
      map.reset();
      map.draw(ctx);
      startLevel();
    }

    function completedLevel() {
      var justCompleted = level;
      var clusterIndex  = level - 1; // level 1 → clusters[0], etc.
      level += 1;

      var clusters = (window.MAINTENANCE_CONFIG && window.MAINTENANCE_CONFIG.RCAC_CLUSTERS) || [];

      if (clusterIndex < clusters.length) {
        revealData       = clusters[clusterIndex];
        revealLevelNum   = justCompleted;
        revealDismissed  = false;
        setState(CLUSTER_REVEAL);
        drawReveal();
        if (revealTimer) { clearTimeout(revealTimer); }
        revealTimer = setTimeout(proceedAfterReveal, 5000);
      } else {
        map.reset();
        user.newLevel();
        startLevel();
      }
    }

    function eatenPill() {
      audio.play('eatpill');
      timerStart = tick;
      eatenCount = 0;
      for (var i = 0; i < ghosts.length; i++) { ghosts[i].makeEatable(ctx); }
    }

    function loseLife() {
      setState(WAITING);
      user.loseLife();
      if (user.getLives() > 0) { startLevel(); }
    }

    function setState(nState) { state = nState; stateChanged = true; }

    function collided(u, ghost) {
      return Math.sqrt(Math.pow(ghost.x - u.x, 2) + Math.pow(ghost.y - u.y, 2)) < 10;
    }

    /* ── Input ── */
    function keyDown(e) {
      if (state === CLUSTER_REVEAL) {
        proceedAfterReveal();
        return true;
      }
      if (e.keyCode === KEY.N) {
        startNewGame();
      } else if (e.keyCode === KEY.S) {
        audio.disableSound();
        try { localStorage['soundDisabled'] = !soundDisabled(); } catch (ex) {}
      } else if (e.keyCode === KEY.P && state === PAUSE) {
        audio.resume();
        map.draw(ctx);
        setState(stored);
      } else if (e.keyCode === KEY.P) {
        stored = state;
        setState(PAUSE);
        audio.pause();
        map.draw(ctx);
        dialog('Paused');
      } else if (state !== PAUSE) {
        return user.keyDown(e);
      }
      return true;
    }

    function keyPress(e) {
      if (state !== WAITING && state !== PAUSE) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    /* ── Draw helpers ── */
    function redrawBlock(pos) {
      map.drawBlock(Math.floor(pos.y / 10), Math.floor(pos.x / 10), ctx);
      map.drawBlock(Math.ceil(pos.y / 10),  Math.ceil(pos.x / 10),  ctx);
    }

    function mainDraw() {
      var i, len = ghosts.length, nScore;
      ghostPos = [];
      for (i = 0; i < len; i++) { ghostPos.push(ghosts[i].move(ctx)); }
      var u = user.move(ctx);

      for (i = 0; i < len; i++) { redrawBlock(ghostPos[i].old); }
      redrawBlock(u.old);
      for (i = 0; i < len; i++) { ghosts[i].draw(ctx); }
      user.draw(ctx);

      userPos = u['new'];

      for (i = 0; i < len; i++) {
        if (collided(userPos, ghostPos[i]['new'])) {
          if (ghosts[i].isVunerable()) {
            audio.play('eatghost');
            ghosts[i].eat();
            eatenCount += 1;
            nScore = eatenCount * 50;
            drawScore(nScore, ghostPos[i]);
            user.addScore(nScore);
            setState(EATEN_PAUSE);
            timerStart = tick;
          } else if (ghosts[i].isDangerous()) {
            audio.play('die');
            setState(DYING);
            timerStart = tick;
          }
        }
      }
    }

    /* ── Main loop ── */
    function mainLoop() {
      var diff, i, len;

      if (state === CLUSTER_REVEAL) {
        // Redraw the overlay each frame — keeps it crisp, no game logic runs
        drawReveal();
        return;
      }

      if (state !== PAUSE) { ++tick; }

      map.drawPills(ctx);

      if (state === PLAYING) {
        mainDraw();
      } else if (state === WAITING && stateChanged) {
        stateChanged = false;
        map.draw(ctx);
        drawInstructions();
      } else if (state === EATEN_PAUSE && (tick - timerStart) > (Pacman.FPS / 3)) {
        map.draw(ctx);
        setState(PLAYING);
      } else if (state === DYING) {
        if (tick - timerStart > Pacman.FPS * 2) {
          loseLife();
        } else {
          redrawBlock(userPos);
          for (i = 0, len = ghosts.length; i < len; i++) {
            redrawBlock(ghostPos[i].old);
            ghostPos.push(ghosts[i].draw(ctx));
          }
          user.drawDead(ctx, (tick - timerStart) / (Pacman.FPS * 2));
        }
      } else if (state === COUNTDOWN) {
        diff = 5 + Math.floor((timerStart - tick) / Pacman.FPS);
        if (diff === 0) {
          map.draw(ctx);
          setState(PLAYING);
        } else if (diff !== lastTime) {
          lastTime = diff;
          map.draw(ctx);
          dialog('Starting in: ' + diff);
        }
      }

      drawFooter();
    }

    /* ── Init ── */
    function init(wrapper, root) {
      var i, ghost;
      var blockSize = Math.floor(wrapper.offsetWidth / 19);

      canvas = document.createElement('canvas');
      canvas.setAttribute('width',  blockSize * 19 + 'px');
      canvas.setAttribute('height', blockSize * 22 + 50 + 'px');
      wrapper.appendChild(canvas);

      ctx   = canvas.getContext('2d');
      audio = new Pacman.Audio({ soundDisabled: soundDisabled });
      map   = new Pacman.Map(blockSize);
      user  = new Pacman.User({ completedLevel: completedLevel, eatenPill: eatenPill }, map);

      for (i = 0; i < 4; i++) {
        ghost = new Pacman.Ghost({ getTick: getTick }, map, GHOST_COLORS[i]);
        ghosts.push(ghost);
      }

      map.draw(ctx);
      dialog('Loading\u2026');

      var audioEl = document.createElement('audio');
      var ext     = audioEl.canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'mp3';
      var audioFiles = [
        ['start',    root + 'audio/opening_song.' + ext],
        ['die',      root + 'audio/die.' + ext],
        ['eatghost', root + 'audio/eatghost.' + ext],
        ['eatpill',  root + 'audio/eatpill.' + ext],
        ['eating',   root + 'audio/eating.short.' + ext],
        ['eating2',  root + 'audio/eating.short.' + ext]
      ];

      loadAudio(audioFiles, function () { loaded(); });
    }

    function loadAudio(arr, callback) {
      if (arr.length === 0) { callback(); return; }
      var x = arr.pop();
      audio.load(x[0], x[1], function () { loadAudio(arr, callback); });
    }

    function loaded() {
      map.draw(ctx);
      dialog('Press N to start');
      document.addEventListener('keydown', keyDown, true);
      document.addEventListener('keypress', keyPress, true);
      timer = window.setInterval(mainLoop, 1000 / Pacman.FPS);
    }

    return { init: init };
  }());

  /* ── KEY map ────────────────────────────────────────────── */
  var KEY = {
    BACKSPACE:8, TAB:9, ENTER:13, SHIFT:16, CTRL:17, ALT:18, ESCAPE:27,
    SPACEBAR:32, PAGE_UP:33, PAGE_DOWN:34, END:35, HOME:36,
    ARROW_LEFT:37, ARROW_UP:38, ARROW_RIGHT:39, ARROW_DOWN:40,
    DELETE:46, N:78, P:80, S:83
  };
  (function () {
    var i;
    for (i = 48; i <= 57;  i++) { KEY['' + (i - 48)] = i; }
    for (i = 65; i <= 90;  i++) { KEY['' + String.fromCharCode(i)] = i; }
    for (i = 96; i <= 105; i++) { KEY['NUM_PAD_' + (i - 96)] = i; }
    for (i = 112; i <= 123; i++) { KEY['F' + (i - 112 + 1)] = i; }
  }());

  /* ── Map constants ──────────────────────────────────────── */
  Pacman.WALL    = 0;
  Pacman.BISCUIT = 1;
  Pacman.EMPTY   = 2;
  Pacman.BLOCK   = 3;
  Pacman.PILL    = 4;

  Pacman.MAP = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 4, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 4, 0],
    [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
    [2, 2, 2, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 2, 2, 2],
    [0, 0, 0, 0, 1, 0, 1, 0, 0, 3, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    [2, 2, 2, 2, 1, 1, 1, 0, 3, 3, 3, 0, 1, 1, 1, 2, 2, 2, 2],
    [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    [2, 2, 2, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 2, 2, 2],
    [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
    [0, 4, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 4, 0],
    [0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];

  Pacman.WALLS = [
    [{"move":[0,9.5]},{"line":[3,9.5]},{"curve":[3.5,9.5,3.5,9]},{"line":[3.5,8]},{"curve":[3.5,7.5,3,7.5]},{"line":[1,7.5]},{"curve":[0.5,7.5,0.5,7]},{"line":[0.5,1]},{"curve":[0.5,0.5,1,0.5]},{"line":[9,0.5]},{"curve":[9.5,0.5,9.5,1]},{"line":[9.5,3.5]}],
    [{"move":[9.5,1]},{"curve":[9.5,0.5,10,0.5]},{"line":[18,0.5]},{"curve":[18.5,0.5,18.5,1]},{"line":[18.5,7]},{"curve":[18.5,7.5,18,7.5]},{"line":[16,7.5]},{"curve":[15.5,7.5,15.5,8]},{"line":[15.5,9]},{"curve":[15.5,9.5,16,9.5]},{"line":[19,9.5]}],
    [{"move":[2.5,5.5]},{"line":[3.5,5.5]}],
    [{"move":[3,2.5]},{"curve":[3.5,2.5,3.5,3]},{"curve":[3.5,3.5,3,3.5]},{"curve":[2.5,3.5,2.5,3]},{"curve":[2.5,2.5,3,2.5]}],
    [{"move":[15.5,5.5]},{"line":[16.5,5.5]}],
    [{"move":[16,2.5]},{"curve":[16.5,2.5,16.5,3]},{"curve":[16.5,3.5,16,3.5]},{"curve":[15.5,3.5,15.5,3]},{"curve":[15.5,2.5,16,2.5]}],
    [{"move":[6,2.5]},{"line":[7,2.5]},{"curve":[7.5,2.5,7.5,3]},{"curve":[7.5,3.5,7,3.5]},{"line":[6,3.5]},{"curve":[5.5,3.5,5.5,3]},{"curve":[5.5,2.5,6,2.5]}],
    [{"move":[12,2.5]},{"line":[13,2.5]},{"curve":[13.5,2.5,13.5,3]},{"curve":[13.5,3.5,13,3.5]},{"line":[12,3.5]},{"curve":[11.5,3.5,11.5,3]},{"curve":[11.5,2.5,12,2.5]}],
    [{"move":[7.5,5.5]},{"line":[9,5.5]},{"curve":[9.5,5.5,9.5,6]},{"line":[9.5,7.5]}],
    [{"move":[9.5,6]},{"curve":[9.5,5.5,10.5,5.5]},{"line":[11.5,5.5]}],
    [{"move":[5.5,5.5]},{"line":[5.5,7]},{"curve":[5.5,7.5,6,7.5]},{"line":[7.5,7.5]}],
    [{"move":[6,7.5]},{"curve":[5.5,7.5,5.5,8]},{"line":[5.5,9.5]}],
    [{"move":[13.5,5.5]},{"line":[13.5,7]},{"curve":[13.5,7.5,13,7.5]},{"line":[11.5,7.5]}],
    [{"move":[13,7.5]},{"curve":[13.5,7.5,13.5,8]},{"line":[13.5,9.5]}],
    [{"move":[0,11.5]},{"line":[3,11.5]},{"curve":[3.5,11.5,3.5,12]},{"line":[3.5,13]},{"curve":[3.5,13.5,3,13.5]},{"line":[1,13.5]},{"curve":[0.5,13.5,0.5,14]},{"line":[0.5,17]},{"curve":[0.5,17.5,1,17.5]},{"line":[1.5,17.5]}],
    [{"move":[1,17.5]},{"curve":[0.5,17.5,0.5,18]},{"line":[0.5,21]},{"curve":[0.5,21.5,1,21.5]},{"line":[18,21.5]},{"curve":[18.5,21.5,18.5,21]},{"line":[18.5,18]},{"curve":[18.5,17.5,18,17.5]},{"line":[17.5,17.5]}],
    [{"move":[18,17.5]},{"curve":[18.5,17.5,18.5,17]},{"line":[18.5,14]},{"curve":[18.5,13.5,18,13.5]},{"line":[16,13.5]},{"curve":[15.5,13.5,15.5,13]},{"line":[15.5,12]},{"curve":[15.5,11.5,16,11.5]},{"line":[19,11.5]}],
    [{"move":[5.5,11.5]},{"line":[5.5,13.5]}],
    [{"move":[13.5,11.5]},{"line":[13.5,13.5]}],
    [{"move":[2.5,15.5]},{"line":[3,15.5]},{"curve":[3.5,15.5,3.5,16]},{"line":[3.5,17.5]}],
    [{"move":[16.5,15.5]},{"line":[16,15.5]},{"curve":[15.5,15.5,15.5,16]},{"line":[15.5,17.5]}],
    [{"move":[5.5,15.5]},{"line":[7.5,15.5]}],
    [{"move":[11.5,15.5]},{"line":[13.5,15.5]}],
    [{"move":[2.5,19.5]},{"line":[5,19.5]},{"curve":[5.5,19.5,5.5,19]},{"line":[5.5,17.5]}],
    [{"move":[5.5,19]},{"curve":[5.5,19.5,6,19.5]},{"line":[7.5,19.5]}],
    [{"move":[11.5,19.5]},{"line":[13,19.5]},{"curve":[13.5,19.5,13.5,19]},{"line":[13.5,17.5]}],
    [{"move":[13.5,19]},{"curve":[13.5,19.5,14,19.5]},{"line":[16.5,19.5]}],
    [{"move":[7.5,13.5]},{"line":[9,13.5]},{"curve":[9.5,13.5,9.5,14]},{"line":[9.5,15.5]}],
    [{"move":[9.5,14]},{"curve":[9.5,13.5,10,13.5]},{"line":[11.5,13.5]}],
    [{"move":[7.5,17.5]},{"line":[9,17.5]},{"curve":[9.5,17.5,9.5,18]},{"line":[9.5,19.5]}],
    [{"move":[9.5,18]},{"curve":[9.5,17.5,10,17.5]},{"line":[11.5,17.5]}],
    [{"move":[8.5,9.5]},{"line":[8,9.5]},{"curve":[7.5,9.5,7.5,10]},{"line":[7.5,11]},{"curve":[7.5,11.5,8,11.5]},{"line":[11,11.5]},{"curve":[11.5,11.5,11.5,11]},{"line":[11.5,10]},{"curve":[11.5,9.5,11,9.5]},{"line":[10.5,9.5]}]
  ];

  /* ── Bootstrap ──────────────────────────────────────────── */
  // Called by the "Play Game" button in main.js — safe to call multiple times.
  var gameInitialized = false;
  window.rcacGameStart = function () {
    if (gameInitialized) { return; }
    var wrapper = document.getElementById('game-canvas-wrapper');
    if (!wrapper) { return; }
    if (!document.createElement('canvas').getContext) {
      wrapper.textContent = 'Your browser does not support HTML5 Canvas. Please upgrade to a modern browser.';
      return;
    }
    gameInitialized = true;
    window.setTimeout(function () { PACMAN.init(wrapper, './'); }, 0);
  };

}());
