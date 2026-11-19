# Contributing

## Setup

1. Install **Node.js 20 or later** (check with `node -v`).
2. From the repo folder, install the libraries once (and again whenever
   `package.json` changes):

   ```bash
   npm install
   ```

3. Start the game:

   ```bash
   npm run dev
   ```

   Open the `http://localhost:…` address it prints. The page reloads by itself
   when you save a file. Stop it with `Ctrl + C`.

`npm install` creates `node_modules/` and `npm run build` creates `dist/`.
Both are generated, so they are ignored by Git. **Never commit them.**

## Branches

Everyone works on their own branch (`Lucas`, `Neel`, `Axel`) and merges
into `main` with a pull request. Before starting work, update your branch
from `main` (GitHub Desktop: **Branch → Update from main**).

## File ownership

Only the owner edits files in their folders. If you need a change in
someone else's file, ask them first. This keeps merge conflicts rare.

> **Proposed after the move to Phaser, confirm with the team.** Some files
> currently mix lanes (e.g. Keeper movement lives in `ChapterScene.js`); they
> will be split as each owner's step comes up.

| Member | Owns |
| --- | --- |
| Lucas | Game rules and core systems: `src/player/`, `src/shadow/`, `src/puzzles/` (reusable building blocks), `src/core/` (events, rendering), `src/effects/` (lighting, VFX), `package.json`, `vite` config, `.gitattributes`, `.gitignore` |
| Neel | Levels and characters: `src/levels/`, `src/scenes/ChapterScene.js` (level flow), `src/gameplay/ChapterMechanics.js` (level-specific puzzles), `src/animation/`, `src/enemies/`, `assets/characters/`, `scripts/generate_parkour_art.mjs` |
| Axel | Story, audio and UI: `src/scenes/MainMenuScene.js`, `src/ui/`, `src/audio/`, `src/radio/`, `src/gameplay/Cinematics.js`, `audio/`, `assets/fonts/`, `assets/presentation/`, `docs/lore/`, `docs/STORY.md`, `docs/AUDIO_DESIGN.md`, `docs/ART_PRESENTATION.md` |

Shared: `docs/` (except Axel's), `README.md`, `CONTRIBUTING.md`, `index.html`,
`src/main.js`.

Environment art (`assets/environment/`) is Lucas's lane in the Division of
Labor; the current backgrounds are Neel's placeholders.

## Assets and Git LFS

- Files the game loads (`.png`, `.webp`, `.svg`, `.ogg`, `.mp3`, fonts) go in
  plain Git, so the browser build and Vercel get the real files.
- Big source files the game never loads (`.psd`, `.kra`, `.wav` masters,
  video) go through Git LFS automatically. Export a compressed copy for the
  game to use.
- Install LFS once per machine: `brew install git-lfs`, then `git lfs install`.

## Conventions

- JavaScript modules (`import` / `export`), one main class per file.
- Files: `PascalCase.js` for classes, `camelCase.js` for data and helpers.
- Tuning numbers go in named constants at the top of a file (or a tuning
  object), never scattered inline.
- Commit small and often, with a message that says what changed.
- Pull before you start work; push before you stop.
