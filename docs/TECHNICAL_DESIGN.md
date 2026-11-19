# Technical Design

Owner: Lucas.

## Engine

- **Godot 4.7**, standard (GDScript) build.
- **Forward+** renderer: needed for volumetric fog and many real-time lights.
- **Jolt** 3D physics.
- 60 physics ticks per second.

Why Godot over Unity: scenes and resources are plain text, so Git diffs and
merges work; native volumetric fog and 3D lighting cover the 2.5D look; no
license or account setup for a three-person team.

## 2.5D setup

Everything is 3D. Gameplay happens on the **X/Y plane at Z = 0**: X is
left/right, Y is up. Characters and puzzle objects lock their Z position and
only move on that plane. Background and foreground art can sit at any Z for
parallax depth. The camera looks down -Z from positive Z.

1 unit = 1 metre. The Keeper is about 1.8 m tall.

## Physics layers

| # | Name | What is on it |
| --- | --- | --- |
| 1 | world | Static level geometry |
| 2 | keeper | The Keeper |
| 3 | shadow | The detached Shadow |
| 4 | enemies | Skitterers, Wardens, Hollow hitboxes |
| 5 | pushable | Crates and other push/pull objects |
| 6 | grates | Iron grates: block the Keeper, the Shadow passes through |
| 7 | solid_shadow | The Shadow while Solidified (the Keeper can stand on it) |
| 8 | triggers | Pressure plates, checkpoints, zone areas |
| 9 | light_blockers | Anything that stops a light beam |
| 10 | light_receivers | Crystals, light locks, Warden backs |

## Input actions

Defined in `project.godot`; see the controls table in the README. Code reads
actions by name (`Input.is_action_pressed("jump")`), never raw keys.

## Event bus

`GameEvents` (`scripts/core/game_events.gd`) is an autoload of signals that
gameplay emits and audio, UI, radio and level scripts listen to. It is the
contract between lanes; check it before inventing a new hook.

## Folder layout

```
assets/       characters, environment, effects (VFX), textures, fonts
animations/   character animation libraries
audio/        ambience, music, sound_effects
scenes/       levels, player, shadow, enemies, puzzles, lighting, ui, cutscenes, sandbox
scripts/      core, player, shadow, enemies, puzzles, lighting, level_events, story (radio), audio, ui
shaders/      .gdshader files
docs/         design docs; docs/lore for world bible
tests/        automated tests
builds/       exported builds (ignored by Git)
```
