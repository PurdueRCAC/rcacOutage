# RCAC Job Runner — Player Guide

**RCAC Job Runner** is a Pac-Man-style arcade game built into the RCAC maintenance page. Instead of staring at a countdown, you can keep the compute jobs running while the real cluster is back online — and learn about RCAC's cluster history along the way.

---

## How to launch the game

1. On the maintenance page, scroll to the **Maintenance Announcement** card.
2. Click the gold **▶ Play RCAC Job Runner** button at the bottom of the card.
3. The game loads automatically. Click **← Back to Announcement** at any time to return to the maintenance information.

> The game button only appears when RCAC staff have enabled it for this maintenance window.

---

## The story

You are a **Job Runner** navigating the RCAC cluster grid. Your mission: collect as many **compute units** as possible while avoiding system errors that have escaped the ghost cage.

| Game element | What it represents |
|---|---|
| Yellow dot (you) | Job Runner process |
| White dots | Compute units — collect them all to complete a level |
| Flashing large dots | **GPU Boost** — eat one to make errors temporarily vulnerable |
| Red ghost | **OOM Killer** — terminates processes that use too much memory |
| Cyan ghost | **Zombie Process** — a job that finished but won't release resources |
| Pink ghost | **Segfault** — crashes anything it touches |
| Orange ghost | **Timeout** — your job ran too long and is coming for you |

---

## Controls

| Key | Action |
|---|---|
| `↑` `↓` `←` `→` | Move the Job Runner |
| `N` | Start a new game |
| `P` | Pause / Resume |
| `S` | Toggle sound on / off |

The controls are also displayed on the game screen before you start.

---

## Scoring

| Action | Core-Hours earned |
|---|---|
| Collect a compute unit (dot) | 10 |
| Eat a power pill (GPU Boost) | 50 |
| Catch a vulnerable error | 50 × combo multiplier |
| Earn 10,000 Core-Hours | Gain an extra Job Slot |

Your score is shown in the footer as **Core-Hours**. You start with **3 Job Slots** (lives). Lose all three and the game ends — press `N` to start over.

---

## Cluster history unlocks

Every time you complete a level (collect all compute units), a **cluster reveal** appears before the next level begins. Each reveal shows:

- The name and year of an RCAC cluster
- Key hardware specs
- A memorable fact about that system

Complete enough levels to reach **Halcyon**, RCAC's newest cluster. Press any key or wait 5 seconds to dismiss the reveal and continue playing.

---

## Tips

- Plan your route — the ghosts move randomly but they can corner you if you are not paying attention.
- Use the **tunnel** on the left and right sides of the maze to escape when surrounded.
- Eat a GPU Boost pill and then chase down as many errors as possible in quick succession — the combo multiplier increases with each one caught.
- Ghosts flash white/blue when the GPU Boost is about to wear off — stop chasing and start escaping.
- Sound effects help you track when a boost is expiring. Keep sound on with `S`.
