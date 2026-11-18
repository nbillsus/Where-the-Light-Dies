# Contributing

## Setup

1. Install **Godot 4.7** (standard build, not .NET). Everyone uses the same
   version; opening the project in a newer one rewrites files and causes
   noisy diffs.
2. Install Git LFS once per machine, then pull the binary files:

   ```bash
   brew install git-lfs
   git lfs install
   git lfs pull
   ```

3. Open `project.godot` in Godot. The first import creates `.godot/`, which
   is ignored.

## File ownership

Only the owner edits files in their folders. Ask before touching someone
else's scene: `.tscn` merge conflicts are painful to fix.

| Member | Folders |
| --- | --- |
| Lucas | `scripts/player`, `scripts/shadow`, `scripts/lighting`, `scripts/puzzles`, `scripts/core`, `scenes/player`, `scenes/shadow`, `scenes/lighting`, `scenes/puzzles`, `scenes/sandbox`, `assets/environment`, `assets/effects`, `assets/textures`, `shaders`, `project.godot` |
| Neel | `scenes/levels` (one scene per chapter), `scenes/enemies`, `assets/characters`, `animations`, `scripts/enemies`, `scripts/level_events` |
| Axel | `audio`, `scenes/ui`, `scenes/cutscenes`, `scripts/ui`, `scripts/story` (radio), `scripts/audio`, `assets/fonts`, `assets/presentation`, `docs/lore`, `docs/STORY.md`, `docs/AUDIO_DESIGN.md`, `docs/ART_PRESENTATION.md` |

Shared: `docs/` (except lore), `README.md`, `CONTRIBUTING.md`, `tests/`.

Need a change in someone else's folder? Ask them, or make your own scene
that instances theirs.

## Talking between systems

Gameplay code announces events through the `GameEvents` autoload
(`scripts/core/game_events.gd`). Listen there instead of reaching into
another person's nodes:

```gdscript
func _ready() -> void:
    GameEvents.shadow_detached.connect(_start_whispers)
```

Adding a signal is fine. Renaming or removing one breaks other people's
code, so ask Lucas first.

## Conventions

- Files and folders: `snake_case`. Node names: `PascalCase`.
- GDScript: static types on functions and members, tabs for indentation.
- Keep test scenes in your own folder (Lucas uses `scenes/sandbox`).
- Commit small and often, with a message that says what changed.
- Pull before you start work; push before you stop.

## Tests

Automated tests live in `tests/` and run headless from the repo root:

```bash
godot --headless res://tests/test_keeper_movement.tscn
```

It prints PASS/FAIL per check and exits with code 1 if anything fails.
