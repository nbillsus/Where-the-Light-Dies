# Where the Light Dies

An atmospheric, side-scrolling puzzle-platformer prototype that runs in the browser. This build contains two connected five-area chapters: The Signal and The Grasp.

## Run locally

Install Node.js 20 or later, then run:

```bash
npm install
npm run dev
```

Open the local URL Vite prints and choose **New Game**. Chapter 1 runs **Storm Coast → Abandoned Facility → Thornwood → Drowned Cavern → Lantern Vault**. It flows into Chapter 2: **Red Descent → Ossuary Works → Crimson Array → Bloodglass Chamber → Heart of the Works**. The second chapter introduces the shadow's Grasp ability and red beam hazards.

## Controls

| Key | Action |
| --- | --- |
| `A` / `D` or arrow keys | Run as the boy or detached shadow |
| `Space` | Jump as the boy or detached shadow |
| `Q` | Detach or recall the shadow, starting in the Thornwood |
| `F` | Lock or release the detached shadow; locking returns control to the boy |
| `G` | In Chapter 2, grasp or drop a nearby iron weight while controlling the shadow |
| `E` | Operate a nearby mechanism as the boy |
| `R` | Restart the current area (`R` after the finale restarts the chapter) |
| `Esc` | Return to the main menu |

The detached shadow is a pale version of the boy. It runs, jumps, falls, and lands on the same platforms, with no tether distance. Jump into a seal and press `F` to lock the shadow in place, even while airborne; control then returns to the boy. A fallen shadow respawns directly on the boy. If the boy falls, he returns to the beginning of the current area.

## Build and deploy

Run `npm run build` to produce `dist/`. Vercel can build this Vite project from the repository; `dist/` is intentionally ignored. For local level testing, `npm run dev` also accepts `?stage=1` through `?stage=10` and an optional one-based `&checkpoint=6` in the browser URL. These shortcuts are disabled in production builds.

## Project layout

- `src/levels/chapterData.js` defines the five areas and their platform coordinates.
- `src/scenes/ChapterScene.js` handles movement, camera, checkpoints, and transitions.
- `src/gameplay/ShadowController.js` isolates shadow control for later team integration.
- `src/gameplay/ChapterMechanics.js` contains the stage puzzles.
- `src/gameplay/ChapterTwoMechanics.js` contains Grasp, weight plates, and red beam hazards.
- `src/gameplay/Cinematics.js` contains chapter title and reveal sequences.
- `scripts/generate_parkour_art.mjs` regenerates the five editable SVG backgrounds in `assets/environment/parkour/`.
- `scripts/generate_chapter_two_art.mjs` regenerates the five red and black SVG backgrounds in `assets/environment/chapter-two/`.

The chapter route and puzzle steps are described in `docs/LEVEL_DESIGN.md`. The current build is a playable design pass; art, story, timing, sound, and puzzle depth remain open for team iteration.
