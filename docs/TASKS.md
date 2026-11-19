# Tasks

Ownership and phases come from the Division of Labor doc. Each person keeps
their own section.

## Lucas — Game Rules, Core Systems & Graphics

Each step below ends with one commit.

### Phase 1: Prototype (Prologue)

- [x] **Step 1 — Engine and repo setup.** Godot 4.7 project, folder structure
      with ownership, Git LFS rules, input map, physics layers, `GameEvents`
      signal bus for cross-team hooks, and a sandbox scene to test in.
- [x] **Step 2 — Keeper movement.** 2.5D `CharacterBody3D` locked to the
      gameplay plane: run, variable jump (coyote time, jump buffer), ledge
      mantle, ladders, push/pull. All tuning values in one resource.
- [ ] **Step 3 — Shadow detach and Solidify.** Detach/recall state machine,
      control switching (inactive character holds stance), tether limit and
      snap-back, Solidify as a platform the Keeper can stand on. Emits
      `shadow_detached` / `shadow_recalled` for Axel's whisper audio.
- [ ] **Step 4 — Style guide, lantern aura, Phase 1 build.** Palette and
      amber vs. slate-blue lighting rules in `docs/STYLE_GUIDE.md` (building
      on `docs/ART_PRESENTATION.md`), the lantern light radius and rune-reveal
      area, base fog/environment, and the first playable build.

### Phase 2: Vertical Slice (Act 1)

- [ ] Combat: Light Strike 3-hit combo, Flare Pulse, dodge, hit detection, health.
- [ ] Path Anchor ability.
- [ ] Puzzle building blocks: pressure plates, gates, grates, collapsing bridges.
- [ ] Lighthouse and docks environment kits; rain VFX.

### Phase 3: Production (Acts 2–3)

- [ ] Light raycasting, reflection/refraction, light locks; Phase & Switch.
- [ ] Caves, chapel and cliff kits; crystal shaders.

### Phase 4: Polish

- [ ] Final lighting pass, balance tuning, final builds.

## Axel — Audio, Backstory, Graphics/Presentation

This list intentionally covers only the audio, story, and presentation lane. Gameplay programming, combat logic, AI, movement systems, puzzle code, and level scripting are outside this scope.

### Backstory & Narrative

- [x] Draft core story bible for The Keeper, the Detached Shadow, radio contact, and previous crew.
- [x] Define Act 1-3 narrative progression tied to relay restoration.
- [x] Write first-pass radio transmission script for Prologue, Act 1, Act 2, and Act 3.
- [x] Add more chilling lighthouse-origin backstory and Drowned Choir threat concept.
- [x] Add story-based jump-scare beats and player/fog cries for help.
- [ ] Record scratch voice-over for the four radio transmissions.
- [ ] Record scratch cries for help and false Keeper voice lines.
- [ ] Add final voice-over files to `audio/radio/` once recorded.
- [ ] Review level grayboxes and add environmental story notes per location.

### Audio

- [x] Define audio style goals for rain, storm, foghorns, radio static, Shadow detachment, and crystal refraction.
- [x] Define suspense buildup, jump-scare stingers, and cry-for-help voice treatment.
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
  - [ ] lens room knock jump scare
  - [ ] under-pier hand jump scare
  - [ ] chapel reflection glass shriek
  - [ ] close-behind whisper scare
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
