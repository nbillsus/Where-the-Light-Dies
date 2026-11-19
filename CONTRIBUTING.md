# Contributing

## Setup

1. Install Node.js 20 or later.
2. Clone the repository and install the locked dependencies:

   ```bash
   npm install
   ```

3. Start the local development server:

   ```bash
   npm run dev
   ```

4. Open the local URL printed by Vite.

Git LFS is only needed when adding asset types covered by `.gitattributes`.
Do not commit `node_modules/` or `dist/`; both are generated locally.

## Team workflow

- Create or switch to your own branch before editing.
- Work only in the areas assigned to you in the team division-of-labor document.
- Check GitHub Desktop's **Changes** list before committing so generated or unrelated files are not included.
- Commit your work on your branch, push the branch, then open a pull request into `main`.
- Pull the latest `main` before starting a new piece of work.
- Ask the file owner before changing a teammate's active work.

## Project conventions

- Browser game code lives in `src/`.
- Reusable source art and audio live in `assets/` and `audio/`.
- Use descriptive `camelCase` names in JavaScript and kebab-case asset filenames.
- Keep gameplay data in `src/levels/` and reusable systems in `src/gameplay/`.
- Keep commits focused and use a message that describes the player-visible result.

## Checks

Before opening a pull request, run:

```bash
npm run build
```

The build must complete successfully. Test the affected game areas in the browser as well.
