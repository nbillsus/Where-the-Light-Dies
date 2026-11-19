# Tasks

Ownership and phases come from the Division of Labor doc. Each person keeps
their own section.

## Lucas — Game Rules, Core Systems & Graphics

Each step below ends with one commit.

### Phase 1: Prototype (Prologue)

- [x] **Step 1 — Engine and repo setup** (Godot; retired after the move to Phaser).
- [x] **Step 2 — Keeper movement in Godot** (retired; its rules carry over to Step 4).
- [x] **Step 3 — Move to Phaser and clean up the repo.** Bring the branch up
      to Neel's Phaser build, delete the Godot files, stop tracking
      `node_modules`, make Git LFS safe for a browser build, and rewrite the
      setup, technical and mechanics docs for Phaser.
- [ ] **Step 4 — Keeper movement.** Move the Keeper's movement out of
      `ChapterScene.js` into `src/player/` with all numbers in one tuning
      object, measured in art units so jumps match on every screen size.
      Add mantling and ladders. *(Agree with Neel first: it edits his file.)*
- [ ] **Step 5 — The Shadow.** Upgrade `ShadowController.js` to the PRD:
      tether limit with snap-back recall, Solidify (the Keeper can stand on
      it), and a shared event bus with hooks for Axel's whisper audio.
- [ ] **Step 6 — Style guide, lantern light, Phase 1 build.** Colour and
      lighting rules (building on `docs/ART_PRESENTATION.md`), the lantern's
      light radius, and the first playable build on Vercel.

### Phase 2: Vertical Slice (Act 1)

- [ ] Combat: Light Strike 3-hit combo, Flare Pulse, dodge, hit detection, health.
- [ ] Path Anchor ability.
- [ ] Reusable puzzle building blocks (plates, gates, grates, collapsing bridges) out of `ChapterMechanics.js`.
- [ ] Lighthouse and docks environment art; rain effects.

### Phase 3: Production (Acts 2–3)

- [ ] Light beams: reflection/refraction, light locks; Phase & Switch.
- [ ] Caves, chapel and cliff environment art; crystal effects.

### Phase 4: Polish

- [ ] Final lighting pass, balance tuning, final builds.

## Axel — Audio, Backstory, Graphics/Presentation

This list intentionally covers only the audio, story, and presentation lane. Gameplay programming, combat logic, AI, movement systems, puzzle code, and level scripting are outside this scope.

### Backstory & Narrative

- [x] Draft core story bible for The Keeper, the Detached Shadow, radio contact, and previous crew.
- [x] Define Act 1-3 narrative progression tied to relay restoration.
- [x] Write first-pass radio transmission script for Prologue, Act 1, Act 2, and Act 3.
- [ ] Record scratch voice-over for the four radio transmissions.
- [ ] Add final voice-over files to `audio/radio/` once recorded.
- [ ] Review level grayboxes and add environmental story notes per location.

### Audio

- [x] Define audio style goals for rain, storm, foghorns, radio static, Shadow detachment, and crystal refraction.
- [ ] Source or create placeholder ambience loops:
  - [ ] lighthouse interior rain muffled by stone
  - [ ] exterior storm and cliff wind
  - [ ] flooded pier water movement
  - [ ] crystal cave resonance
- [ ] Source or create placeholder one-shot SFX:
  - [ ] lantern flare
  - [ ] Shadow detach
  - [ ] Shadow recall
  - [ ] crystal beam lock-on
  - [ ] relay restore
  - [ ] radio tuning sweep
- [ ] Create naming convention and import notes for final audio assets.

### Graphics & Presentation

- [x] Define visual presentation direction: ochre Keeper, smoky Shadow, amber safety light, slate-blue storm, pitch-black threats.
- [ ] Produce concept sketches or reference board for:
  - [ ] The Keeper silhouette
  - [ ] Detached Shadow silhouette
  - [ ] lighthouse lantern room
  - [ ] storm-lashed pier
  - [ ] crystal cave/sunken chapel
- [ ] Create opening cutscene storyboard thumbnails.
- [ ] Create radio UI mockup or visual reference for the tuning/readout element.
- [ ] Add final concept and presentation files to `assets/presentation/` when ready.

### Handoff Notes For Teammates

- Radio triggers should be placed at major relay checkpoints, but this task list does not implement trigger code.
- Audio files should be delivered as clean loops or one-shots with obvious names so the gameplay programmer can wire them into events.
- Presentation assets should communicate lighting, mood, and readable silhouettes before high-detail polish.
