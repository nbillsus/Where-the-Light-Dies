# Scoped Task List - Audio, Backstory, Graphics/Presentation

This list intentionally covers only the audio, story, and presentation lane. Gameplay programming, combat logic, AI, movement systems, puzzle code, and level scripting are outside this scope.

## Backstory & Narrative

- [x] Draft core story bible for The Keeper, the Detached Shadow, radio contact, and previous crew.
- [x] Define Act 1-3 narrative progression tied to relay restoration.
- [x] Write first-pass radio transmission script for Prologue, Act 1, Act 2, and Act 3.
- [ ] Record scratch voice-over for the four radio transmissions.
- [ ] Add final voice-over files to `audio/radio/` once recorded.
- [ ] Review level grayboxes and add environmental story notes per location.

## Audio

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

## Graphics & Presentation

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

## Handoff Notes For Teammates

- Radio triggers should be placed at major relay checkpoints, but this task list does not implement trigger code.
- Audio files should be delivered as clean loops or one-shots with obvious names so the gameplay programmer can wire them into events.
- Presentation assets should communicate lighting, mood, and readable silhouettes before high-detail polish.
