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

## Puzzle building blocks

Current mechanisms in `src/gameplay/ChapterMechanics.js`: gates, pressure
plates, pushable crates, switches, ignitors (including timed ones), Shadow
receivers, collapsing bridges, moving platforms. Each area builds its own
set; turning them into reusable building blocks is a Lucas task for Phase 2.

## Checkpoints and death

- Falling off returns the Keeper to the start of the current area.
- **R** restarts the area; mechanisms reset.
- There is no save system yet.
