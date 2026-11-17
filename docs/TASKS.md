# Tasks

Ownership and phases come from the Division of Labor doc. Each step below ends
with one commit by its owner.

## Lucas — Game Rules, Core Systems & Graphics

### Phase 1: Prototype (Prologue)

- [ ] **Step 1 — Engine and repo setup.** Godot 4.7 project, folder structure
      with ownership, Git LFS rules, input map, physics layers, `GameEvents`
      signal bus for cross-team hooks, and a sandbox scene to test in.
- [ ] **Step 2 — Keeper movement.** 2.5D `CharacterBody3D` locked to the
      gameplay plane: run, variable jump (coyote time, jump buffer), ledge
      mantle, ladders, push/pull. All tuning values in one resource.
- [ ] **Step 3 — Shadow detach and Solidify.** Detach/recall state machine,
      control switching (inactive character holds stance), tether limit and
      snap-back, Solidify as a platform the Keeper can stand on. Emits
      `shadow_detached` / `shadow_recalled` for Axel's whisper audio.
- [ ] **Step 4 — Style guide, lantern aura, Phase 1 build.** Palette and
      amber vs. slate-blue lighting rules in `docs/STYLE_GUIDE.md`, the
      lantern light radius and rune-reveal area, base fog/environment, and the
      first playable build.

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
