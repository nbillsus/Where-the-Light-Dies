# Technical Design

Owner: Lucas.

## Runtime

- **Phaser 3.90**: rendering (WebGL), input, scenes and Arcade Physics.
- **Arcade physics**: Phaser's simple box physics. Gravity 1250 px/s².
- **Vite 7**: dev server (`npm run dev`) and production build
  (`npm run build` → `dist/`).
- Native JavaScript modules, targeting modern browsers.
- **Hosting**: Vercel builds the project with `npm run build` and serves
  `dist/`. Nothing to install for players.

The game uses a full-window Phaser canvas with antialiasing. Its logical
resolution follows the browser window, while render scaling keeps artwork
sharp on high-density displays.

The project started in Godot 4.7 (2.5D, 3D lighting). The team moved to
Phaser in November 2026 for a browser-first 2D build. Depth now comes from
layered 2D art rather than 3D models; the PRD's look (amber lantern light
against slate-blue storm and black shadow) is kept through art and 2D
lighting effects.

## Game structure

```
index.html                        page that loads the game
src/main.js                       Phaser config: scaling, rendering, physics, scenes
src/rendering.js                  shared resolution and text-sharpening helpers
src/scenes/MainMenuScene.js       title screen and menu flow
src/scenes/ChapterScene.js        level runtime: input, movement, camera, checkpoints, area transitions
src/levels/chapterData.js         source of truth for area sizes, platforms and progression
src/gameplay/ShadowController.js  the detached Shadow
src/gameplay/ChapterMechanics.js  puzzle mechanisms per area
src/gameplay/Cinematics.js        title pulses and reveal sequences
src/animation/BoyAnimator.js      procedural run and jump animation
assets/                           images and SVG backgrounds the game loads
audio/                            sound and music files the game loads
scripts/generate_parkour_art.mjs  regenerates the editable SVG backgrounds
docs/                             design docs
```

## Coordinates and scale

- Each area is authored in **art coordinates**: 4096 × 900, origin
  top-left, Y pointing **down**. Platforms in `src/levels/chapterData.js`
  use these.
- At runtime `ChapterScene` scales the art and platforms to fit the window
  height: `artScale = window height / 900`.
- Movement speeds are currently in **screen pixels**, not art units, so the
  same jump covers more of the level on a small window than on a large one.
  Fixing this is part of Lucas's Keeper movement step.

## Scenes and flow

`MainMenu` → **New Game** → `Chapter` (level 0) → each area's exit starts
`Chapter` again with the next `levelIndex` → finale.

The player and Shadow share gravity-based movement, jumping, coyote time and
jump buffering. Puzzle behaviour is isolated in `ChapterMechanics`, and puzzles
only ask the Shadow "are you anchored near this receiver?", so level data and
the Shadow can change independently.

Dev-only shortcuts in the URL: `?stage=1`…`?stage=5` (applies when you press
**New Game**), optionally `&checkpoint=N`.

## Asset pipeline

- Menu and character PNGs live under `assets/`.
- Level backgrounds are SVG files in `assets/environment/parkour/`, generated
  by `scripts/generate_parkour_art.mjs`.
- Runtime assets stay in plain Git; only large source files use Git LFS (see
  `.gitattributes` and CONTRIBUTING.md).
- `node_modules/` and `dist/` are generated and must never be committed.

## Validation

`npm run build` is the required automated check before a pull request.
Gameplay changes also need browser testing at the affected stages and
checkpoints.

## Events for other systems (planned)

Audio, UI and radio code should react to gameplay without reaching into the
player or Shadow objects. Lucas will add a small shared event bus
(`src/core/events.js`) in the Shadow step with at least:

| Event | When | Used by |
| --- | --- | --- |
| `shadow-detached` / `shadow-recalled` | Shadow leaves / returns | Axel: whisper audio |
| `shadow-detach-time` (seconds) | Every frame while detached | Axel: whisper volume |
| `shadow-tether` (0–1) | Tether tension | HUD tether indicator |
| `keeper-landed` (fall speed) | Landing | Footstep / thud audio |
| `beam-hit-target` | Light beam reaches a receiver | Crystal chime |
| `relay-restored` (index) | Relay checkpoint activated | Radio log |
| `checkpoint-reached` | Checkpoint touched | Save / respawn |
