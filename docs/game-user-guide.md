# RCAC Games — Player Guide

Two arcade games are built into the RCAC maintenance page. Instead of staring at a countdown, pick one and play while the cluster comes back online.

---

## How to launch a game

1. On the maintenance page, scroll to the **Maintenance Announcement** card.
2. Click one of the gold **▶ Play** buttons at the bottom of the card — **PACMAN Job Runner** (Pac-Man style) or **TRON Light Cycle**.
3. The game loads immediately. Click **← Back to Announcement** at any time to return to the maintenance information.

> The game buttons only appear when RCAC staff have enabled games for this maintenance window.

---

## PACMAN Job Runner (Pac-Man)

### The story

You are a **Job Runner** navigating the RCAC cluster grid. Your mission: collect as many **compute units** as possible while avoiding system errors that have escaped the ghost cage.

| Game element | What it represents |
[|-------------|--------------------|]
| Yellow dot (you) | Job Runner process |
| White dots | Compute units — collect them all to complete a level |
| Flashing large dots | **GPU Boost** — eat one to make errors temporarily vulnerable |
| Red ghost | **OOM Killer** — terminates processes that use too much memory |
| Cyan ghost | **Zombie Process** — a job that finished but won't release resources |
| Pink ghost | **Segfault** — crashes anything it touches |
| Orange ghost | **Timeout** — your job ran too long and is coming for you |

---

### Controls

| Key | Action |
[|----|--------|]
| `↑` `↓` `←` `→` | Move the Job Runner |
| `N` | Start a new game |
| `P` | Pause / Resume |
| `S` | Toggle sound on / off |

The controls are also displayed on the game screen before you start.

---

### Scoring

| Action | Core-Hours earned |
[|-------|-------------------|]
| Collect a compute unit (dot) | 10 |
| Eat a power pill (GPU Boost) | 50 |
| Catch a vulnerable error | 50 × combo multiplier |
| Earn 10,000 Core-Hours | Gain an extra Job Slot |

Your score is shown in the footer as **Core-Hours**. You start with **3 Job Slots** (lives). Lose all three and the game ends — press `N` to start over.

---

### Cluster history unlocks

Every time you complete a level (collect all compute units), a **cluster reveal** appears before the next level begins. Each reveal shows:

- The name and year of an RCAC cluster
- Key hardware specs
- A memorable fact about that system

Complete enough levels to reach **Halcyon**, RCAC's newest cluster. Press any key or wait 5 seconds to dismiss the reveal and continue playing.

---

### Tips

- Plan your route — the ghosts move randomly but they can corner you if you are not paying attention.
- Use the **tunnel** on the left and right sides of the maze to escape when surrounded.
- Eat a GPU Boost pill and then chase down as many errors as possible in quick succession — the combo multiplier increases with each one caught.
- Ghosts flash white/blue when the GPU Boost is about to wear off — stop chasing and start escaping.
- Sound effects help you track when a boost is expiring. Keep sound on with `S`.

---

## TRON Light Cycle

### Tron: The story

You are a **Light Cycle** pilot in the RCAC grid. Leave an energy trail behind you as you race — force the AI opponent into its own trail or yours to defeat it. Every AI you take down speeds up the grid.

### Tron: Controls

| Key | Action |
| --- | --- |
| `↑` `↓` `←` `→` or `W` `A` `S` `D` | Steer the light cycle |
| `Enter` | Restart after game over |

You cannot reverse direction — plan turns before you need them.

### Tron: Scoring

| Action | Points |
| ------ | ------ |
| Survive each grid cell (trail laid) | +10 |
| AI opponent crashes on its own | +5000 |
| Strategic cut-off (cross AI path perpendicularly) | +10000 |

Every time you defeat the AI, the grid speed increases. Survive as long as possible.

### Tron: Gameplay

- Each round generates random barrier shapes on the grid — no two rounds are the same.
- The AI respawns 1 second after being defeated, entering from a random edge position.
- Speed caps at the fastest setting after enough AI defeats — that is when the real challenge begins.
- A **shatter effect** plays when either cycle is destroyed; a **screen flash** fires when the speed increases.

### Tron: Tips

- The AI is imperfect by design — it makes random turns and occasionally panics. Patience beats aggression.
- Cut the AI off by crossing its path at a right angle — the game rewards this with the +10000 strategic bonus.
- Barriers can work in your favour: box the AI into a corner while you take the open space.
- The game fills the entire screen — use the full width and height to give yourself room.
