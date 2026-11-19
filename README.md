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
storm coast prototype. Use `A` / `D` or arrow keys to run, `Space` to jump,
`Q` to detach or recall the Shadow, and `Esc` to return to the menu. While the
Shadow is detached, movement keys guide it within its tether range.

## Build and deploy

Run `npm run build` to create a production build in `dist/`. Vercel builds this
project from source automatically when the repository is imported, so `dist/`
is intentionally not committed.

## Prototype scope

The title screen and coastal ruins are code-drawn prototype art. Settings for
rain and screen shake are saved in the browser. Collections will gain entries
when the team adds story content.
