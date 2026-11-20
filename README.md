# Where the Light Dies

An atmospheric, side-scrolling puzzle-platformer prototype that runs in the browser. This build contains two connected five-area chapters: The Signal and The Grasp.

## Run locally

Install Node.js 20 or later, then run:

```bash
npm install
npm run dev
```

Open the local URL Vite prints and choose **New Game**, then choose one of three save slots. Chapter 1 runs **Storm Coast → Abandoned Facility → Thornwood → Drowned Cavern → Lantern Vault**. It flows into Chapter 2: **Red Descent → Ossuary Works → Cold Array → Bloodglass Chamber → Heart of the Works**. Chapter 2 varies its color and puzzle language by area, introducing Grasp, ordinary pushable weights, machinery, and beam hazards.

**Continue Game** lists the three slots and resumes the chosen save. Saves include the current area, position, and puzzle state. Progress saves when changing areas, every five seconds during play, on browser page exit, and when choosing **Save & Main Menu** from the pause screen. Saves use this browser's local storage, so they survive reloads on the same browser and site. They are not shared between devices or browser profiles.

## Controls

| Key | Action |
| --- | --- |
| `A` / `D` or arrow keys | Run as the boy or detached shadow |
| `Space` | Jump as the boy or detached shadow |
| `Q` | Detach or recall the shadow, starting in the Thornwood |
| `F` | Lock or release the detached shadow; locking returns control to the boy |
| `G` | In Grasp areas, lift or drop a nearby pale relic while controlling the shadow; ordinary wooden weights are pushed by the boy |
| `E` | Operate a nearby mechanism as the boy |
| `J` or left click | Light Strike: a 3-hit lantern combo (the third hit is heavier) |
| `K` or right click | Flare Pulse: a burst of light that destroys Skitterers and stuns Wardens (6 s recharge) |
| `Shift` | Dodge: a quick dash you can't be hurt during; with no direction held it's a backstep |
| `R` | Restart the current area (`R` after the finale restarts the chapter) |
| `Esc` | Pause or resume; the pause menu has Resume, Save & Main Menu, and Settings |

The detached shadow is a pale version of the boy. It runs, jumps, falls, and lands on the same platforms, with no tether distance. Jump into a seal and press `F` to lock the shadow in place, even while airborne; control then returns to the boy. A fallen shadow respawns directly on the boy. If the boy falls, he returns to the beginning of the current area.

## Build and deploy

Run `npm run build` to produce `dist/`. Vercel can build this Vite project from the repository; `dist/` is intentionally ignored. For local level testing, `npm run dev` also accepts `?stage=1` through `?stage=10` and an optional one-based `&checkpoint=6` in the browser URL. These shortcuts are disabled in production builds.

## Project layout

- `src/levels/chapterData.js` defines the five areas and their platform coordinates.
- `src/scenes/ChapterScene.js` handles movement, camera, checkpoints, and transitions.
- `src/gameplay/ShadowController.js` isolates shadow control for later team integration.
- `src/gameplay/ChapterMechanics.js` contains the stage puzzles.
- `src/gameplay/ChapterTwoMechanics.js` contains the varied Chapter 2 puzzles: Grasp seals, ordinary mass plates, levers, and beam hazards.
- `src/gameplay/Cinematics.js` contains chapter title and reveal sequences.
- `scripts/generate_parkour_art.mjs` regenerates the five editable SVG backgrounds in `assets/environment/parkour/`.
- `scripts/generate_chapter_two_art.mjs` regenerates the five distinct SVG backgrounds in `assets/environment/chapter-two/`.

The chapter route and puzzle steps are described in `docs/LEVEL_DESIGN.md`. The current build is a playable design pass; art, story, timing, sound, and puzzle depth remain open for team iteration.
