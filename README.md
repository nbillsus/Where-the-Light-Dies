# Where the Light Dies

A 2.5D atmospheric horror puzzle-platformer. The Keeper detaches their own
living Shadow to build platforms, hold paths and refract light across a
storm-battered lighthouse island.

Built with **Godot 4.7** (Forward+ renderer, Jolt physics).

## Getting started

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup (Godot version, Git LFS) and
who owns which folders. Open `project.godot` in Godot and press F5 (Play).

## Shared baseline

The game starts on a temporary title screen that leads into a code-drawn 2D
lighthouse graybox with basic movement and jumping (`scenes/ui/MainMenu.tscn`,
`scenes/levels/PrototypeLevel.tscn`). It is a shared bootstrap, not production
art, lore, animation, or mechanics; the real 2.5D systems replace it over time.

Lucas's 3D test room is `scenes/sandbox/sandbox.tscn`: open it and press F6
(Run Current Scene).

## Controls

| Action | Keyboard / mouse | Gamepad |
| --- | --- | --- |
| Move / climb | A D W S or arrow keys | Left stick, D-pad |
| Jump | Space | A |
| Interact (push/pull, levers) | E | X |
| Detach / recall Shadow | Q | Y |
| Shadow ability | F | RB |
| Light Strike | J or left click | RT |
| Flare Pulse | K or right click | B |
| Dodge | Shift | LT |
| Pause | Esc | Start |

## Docs

- [Game design](docs/GAME_DESIGN.md)
- [Mechanics](docs/MECHANICS.md)
- [Level design](docs/LEVEL_DESIGN.md)
- [Story](docs/STORY.md)
- [Audio design](docs/AUDIO_DESIGN.md)
- [Art & presentation](docs/ART_PRESENTATION.md)
- [Technical design](docs/TECHNICAL_DESIGN.md)
- [Tasks](docs/TASKS.md)
