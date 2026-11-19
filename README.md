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

Open the local URL Vite prints in the terminal. Press `Begin Prototype` to
enter the lighthouse graybox. Use `A` / `D` or arrow keys to move, `Space` to
jump, and `Esc` to return to the menu.

## Build and deploy

Run `npm run build` to create a production build in `dist/`. Vercel builds this
project from source automatically when the repository is imported, so `dist/`
is intentionally not committed.

## Prototype scope

The current title screen and lighthouse scene are code-drawn placeholders for
the web prototype. They establish the mood and interaction loop without
locking the team into final art, lore, animation, or gameplay systems.
