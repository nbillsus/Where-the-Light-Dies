# Where the Light Dies

An atmospheric, side-scrolling puzzle-platformer prototype that runs in the browser. This build is the first playable pass of Chapter 1, with five connected areas and an ending reveal.

## Run locally

Install Node.js 20 or later, then run:

```bash
npm install
npm run dev
```

Open the local URL Vite prints and choose **New Game**. The route is **Storm Coast → Abandoned Facility → Thornwood → Drowned Cavern → Lantern Vault**. The Coast and Facility teach movement and environmental mechanisms before the shadow appears in the Thornwood.

## Controls

| Key | Action |
| --- | --- |
| `A` / `D` or arrow keys | Run as the boy or detached shadow |
| `Space` | Jump as the boy or detached shadow |
| `Q` | Detach or recall the shadow, starting in the Thornwood |
| `F` | Lock or release the detached shadow; locking returns control to the boy |
| `E` | Operate a nearby mechanism as the boy |
| `R` | Restart the current area (`R` after the finale restarts the chapter) |
| `Esc` | Return to the main menu |

The detached shadow is a pale version of the boy. It runs, jumps, falls, and lands on the same platforms, with no tether distance. Jump into a seal and press `F` to lock the shadow in place, even while airborne; control then returns to the boy. A fallen shadow respawns beside the boy.

## Build and deploy

Run `npm run build` to produce `dist/`. Vercel can build this Vite project from the repository; `dist/` is intentionally ignored. For local level testing, `npm run dev` also accepts `?stage=1` through `?stage=5` and an optional one-based `&checkpoint=6` in the browser URL. These shortcuts are disabled in production builds.

## Project layout

- `src/levels/chapterData.js` defines the five areas and their platform coordinates.
- `src/scenes/ChapterScene.js` handles movement, camera, checkpoints, and transitions.
- `src/gameplay/ShadowController.js` isolates shadow control for later team integration.
- `src/gameplay/ChapterMechanics.js` contains the stage puzzles.
- `src/gameplay/Cinematics.js` contains chapter title and reveal sequences.
- `scripts/generate_parkour_art.mjs` regenerates the five editable SVG backgrounds in `assets/environment/parkour/`.

The chapter route and puzzle steps are described in `docs/LEVEL_DESIGN.md`. The current build is a playable design pass; art, story, timing, sound, and puzzle depth remain open for team iteration.
