# Where the Light Dies

A browser-based atmospheric puzzle-platformer prototype. The current playable
build uses Vite and Phaser, so it runs directly in a web browser and can be
deployed to Vercel for classroom testing.

## Run locally

Install Node.js 20 or later, then run:

```bash
npm install
npm run dev
```

Open the local URL Vite prints in the terminal. Select `New Game` to enter the
single-screen test room. Use `A` / `D` or arrow keys to run, `Space` to jump,
and `Esc` to return to the menu. Shadow controls are not part of this test room.

## Build and deploy

Run `npm run build` to create a production build in `dist/`. Vercel builds this
project from source automatically when the repository is imported, so `dist/`
is intentionally not committed.

## Prototype scope

The title screen and test room use supplied artwork. The test room has one
walkable floor and no level transitions. Collections will gain entries when
the team adds story content.
