# Mechanics

Owner: Lucas. These are the rules the game implements. Units are screen
pixels and seconds unless noted (see "Coordinates and scale" in
`TECHNICAL_DESIGN.md`).

This page describes the **current Phaser build** (Neel's first playable pass).
Planned changes from Lucas's steps are marked *planned*. Movement constants
live in `src/scenes/ChapterScene.js` and Shadow movement in
`src/gameplay/ShadowController.js`; update this page when those rules change.

## The Keeper: movement

Values from `src/scenes/ChapterScene.js`.

| Rule | Value |
| --- | --- |
| Top run speed | 320 px/s |
| Acceleration while running | 2100 px/s² |
| Slowdown | 900 px/s² while a direction is held, 2200 px/s² when released |
| Gravity | 1250 px/s² |
| Jump takeoff speed | 490 px/s (full jump about 96 px high) |
| Short hop | Releasing jump early cuts upward speed by 14% each frame while rising faster than 180 px/s |
| Coyote time | Can still jump 0.12 s after leaving a platform |
| Jump buffer | A jump pressed up to 0.13 s before landing still happens |
| Falling off the level | Restart at the beginning of the current area |

*Planned (Keeper movement step):* move these numbers into one tuning object,
measure them in art units so jumps are the same on every window size, and add
mantling and ladders.

## The Shadow

Current behaviour, from `src/gameplay/ShadowController.js`:

- **Q** detaches the Shadow at the Keeper's position. Control switches to
  the Shadow; the Keeper stops and holds still.
- The Shadow runs and jumps exactly like the Keeper (same numbers).
- **F** anchors the Shadow in place, even in mid-air. Control returns to the
  Keeper. **F** again releases it and gives control back to the Shadow.
- **Q** again recalls the Shadow to the Keeper.
- If the Shadow falls off the level it reappears on the Keeper.
- Puzzles only check "is the Shadow anchored near this receiver?"
- There is currently **no tether limit**.

*Planned (Shadow step), from the PRD:*

| Ability | Rule |
| --- | --- |
| Tether Limit | The Shadow can't move further than a set distance from the Keeper; recall snaps it back instantly |
| Solidify | Anchored Shadow becomes a solid platform the Keeper can stand on |
| Path Anchor | Anchored Shadow holds collapsing paths open (Phase 2) |
| Phase & Switch | Shadow slips under grates to reach switches (Phase 3) |
| Light Reflection & Refraction | Shadow redirects light beams (Phase 3) |

## Combat

Code: `src/combat/Combat.js` (numbers in `TUNING` at the top).

| Move | Key | Rules |
| --- | --- | --- |
| Light Strike | `J` / left click | 3-hit combo. A press within 0.56 s of the last continues it; presses closer than 0.23 s are ignored. Damage 1, 1, 2. Reaches 0.66 × the boy's height in front of him. |
| Flare Pulse | `K` / right click | Radius 1.75 × boy height. Destroys Skitterers, stuns Wardens for 2.2 s. Recharges in 6 s (ring next to the health flames). |
| Dodge | `Shift` | 0.21 s dash at 820 px/s, invulnerable throughout; the way you're pushing, or a backstep with no direction held. 0.65 s recharge. |

- **Health:** 5 flames. A hit costs 1, knocks the boy back and makes him
  invulnerable for 1.1 s. At 0 the screen fades, the boy returns to the
  start of the area with full health, enemies come back, and solved puzzles
  stay solved. Falling into a pit doesn't cost health.
- Can't attack while controlling the Shadow (the boy is vulnerable then).

### Enemies

Code: `src/enemies/`. Placement per area: `src/enemies/placements.js`.
Enemies stay on the ledge they spawn on.

| Enemy | Health | Behaviour | How to beat it |
| --- | --- | --- | --- |
| Skitterer | 1 | Hunts within 3.4 × boy height. Facing it with the lantern makes it **hesitate** at the edge of the light, but every 0.9–1.6 s it **lunges** in anyway. From behind it rushes straight in. Touching it hurts (1 damage, 0.8 s cooldown). | Strike it as it lunges, or Flare Pulse a group. |
| Shroud Warden | 4 | Patrols; walks up and swings when you're in front (0.65 s wind-up with raised blade and red eyes, 1 damage). **Front is armoured**: strikes there spark and push you back. Takes 0.48 s to turn round and stands still 0.7 s after each swing. Walking into it hurts (1). | Dodge through it during the wind-up and strike its back, or stun it with a Flare Pulse (armour goes dark) and hit from any side. |

### Bosses

The last area of each chapter ends in a boss arena (the level was lengthened
to 5900 art units for it). Walking in locks the entrance; the exit opens only
when the boss dies. Dying in the arena returns you to its entrance with full
health and resets the boss. Code: `src/enemies/bosses/`.

| Boss | Where | Health | Attacks | Weak point |
| --- | --- | --- | --- | --- |
| **The Hollow** | Ch. 1, Lantern Vault | 26 | **Slam** (red mark on the floor, 0.82 s): crush 2, floor shock 1 (jump it). **Sweep** (arm pulled back, 0.56 s): rakes the floor, 1 (jump it). Below half health: faster, rolling dark **waves** (1, jump or dodge), summons Skitterers. Touching it hurts. | Its chest **core** is caged in ribs. It opens only while the Hollow slumps: for 1.5 s after a slam (its hand is stuck in the floor), or for 1.8 s after a Flare Pulse (once per 7 s). |
| **The Heart of the Works** | Ch. 2, Heart of the Works | 24 | **Hand slam** (red mark tracks the boy, 0.9 s): 2. **Beam sweep** (red line flickers, 0.65 s): a beam crosses the arena floor, 1 — dodge through it or stand on a ledge. Below half health: two hands at once, the beam sweeps back, summons Skitterers. A Flare Pulse stalls its attacks for 1.5 s. | The core is **shielded**. Anchor the Shadow in one of the two receptors above the arena ledges (Q, move, F): the shield drops for 5.2 s. Each receptor then recharges for 9 s. The boy is defenceless while you steer the Shadow. |

### Combat events

Emitted on the level scene (`scene.events`) for audio and UI:
`combat:strike` (combo step), `combat:hit` (enemy, blocked),
`combat:flare` (x, y), `combat:hurt` (health left), `combat:died`,
`combat:enemy-killed` (enemy). Current sounds are synthesised placeholders
in `src/combat/sfx.js`.

## Puzzle building blocks

Current mechanisms in `src/gameplay/ChapterMechanics.js`: gates, pressure
plates, pushable crates, switches, ignitors (including timed ones), Shadow
receivers, collapsing bridges, moving platforms. Each area builds its own
set; turning them into reusable building blocks is a Lucas task for Phase 2.

## Checkpoints and death

- Falling off returns the Keeper to the start of the current area.
- **R** restarts the area; mechanisms reset.
- There is no save system yet.
