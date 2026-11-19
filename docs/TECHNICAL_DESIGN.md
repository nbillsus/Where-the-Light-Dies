# Technical Design

Owner: Lucas.

## Stack

- **Phaser 3.90**: 2D game framework, WebGL rendering, runs in the browser.
- **Arcade physics**: Phaser's simple box physics. Gravity 1250 px/s².
- **Vite 7**: dev server (`npm run dev`) and production build (`npm run build` → `dist/`).
- **Hosting**: Vercel builds the repo with Vite. Nothing to install for players.

The project started in Godot 4.7 (2.5D, 3D lighting). The team moved to
Phaser in November 2026 for a browser-first 2D build. Depth now comes from
layered 2D art rather than 3D models; the PRD's look (amber lantern light
against slate-blue storm and black shadow) is kept through art and 2D
lighting effects.

## Project layout

```
index.html            page that loads the game
src/main.js           creates the Phaser game and lists the scenes
src/rendering.js      sharp rendering on high-density screens
src/scenes/           MainMenuScene (title), ChapterScene (gameplay)
src/levels/           level data: platform coordinates per area
src/gameplay/         shadow controller, puzzle mechanisms, cinematics
src/animation/        code-drawn character animation
assets/               images and SVG backgrounds the game loads
audio/                sound and music files the game loads
scripts/              build-time tools (e.g. background art generator)
docs/                 design docs
```

## Coordinates and scale

- Each area is drawn in **art coordinates**: 4096 × 900, origin top-left,
  Y pointing **down**. Platforms in `src/levels/chapterData.js` use these.
- At runtime the art is scaled to fit the window height:
  `artScale = window height / 900`. Platform positions are multiplied by it.
- Movement speeds are currently in **screen pixels**, not art units, so the
  same jump covers more of the level on a small window than on a large one.
  Fixing this is part of Lucas's Keeper movement step.

## Scenes and flow

`MainMenu` → **New Game** → `Chapter` (level 0) → each area's exit starts
`Chapter` again with the next `levelIndex` → finale.

Dev-only shortcuts in the URL: `?stage=1`…`?stage=5`, optionally
`&checkpoint=N`.

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
