# Technical Design

## Runtime

- **Phaser 3** provides rendering, input, scenes, and Arcade Physics.
- **Vite** provides local development and the production browser build.
- The game is written as native JavaScript modules and targets modern browsers.
- Vercel builds the project with `npm run build` and serves `dist/`.

The game uses a full-window Phaser canvas with antialiasing enabled. Its logical
resolution follows the browser window while render scaling keeps artwork sharp on
high-density displays.

## Game structure

- `src/main.js` configures Phaser, scaling, rendering, physics, and scenes.
- `src/scenes/MainMenuScene.js` owns the title screen and menu flow.
- `src/scenes/ChapterScene.js` owns the side-scrolling level runtime, input,
  checkpoints, camera, and area transitions.
- `src/levels/chapterData.js` is the source of truth for area dimensions,
  platforms, and progression.
- `src/gameplay/` contains the shadow, mechanisms, and cinematic presentation.
- `src/animation/BoyAnimator.js` supplies the procedural run and jump motion.
- `src/rendering.js` contains shared resolution and text-sharpening helpers.

## Physics and coordinates

Phaser Arcade Physics runs the player, detached shadow, platforms, and moving
mechanisms in a 2D world. Each area is authored at 4096 × 900 logical art units.
`ChapterScene` scales platform coordinates and artwork to the current viewport so
the same data works across screen sizes.

The player and shadow share gravity-based horizontal movement, jumping, coyote
time, and jump buffering. Puzzle behavior is isolated in `ChapterMechanics` so
level data and presentation can evolve without duplicating player movement.

## Asset pipeline

- Menu and character PNGs live under `assets/`.
- Long-form level backgrounds are SVG files in `assets/environment/parkour/`.
- `scripts/generate_parkour_art.mjs` regenerates those editable SVG backgrounds.
- Large binary source assets use Git LFS rules from `.gitattributes`.
- `node_modules/` and `dist/` are generated and must never be committed.

## Validation

`npm run build` is the required automated check before a pull request. Gameplay
changes also need browser testing at the affected stages and checkpoints.
