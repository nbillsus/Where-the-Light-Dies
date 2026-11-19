# Where the Light Dies - Graphics & Presentation Guide

## Visual Promise

The game should look lush and dimensional while staying readable on a 2D gameplay plane. The presentation target is gothic coastal horror with strong chiaroscuro: warm safe light against cold rain and absolute darkness.

## Palette

| Purpose | Color Family | Notes |
| --- | --- | --- |
| Safety, lantern, rescue | amber, brass, weathered gold | player-readable safe zones and story hope |
| Storm, ocean, exterior danger | slate blue, blue-gray, cold green | dominant environmental mood |
| Active darkness | near-black, oily gray | avoid detail except rim highlights |
| Crystal systems | pale cyan, white, prismatic glints | should read as functional puzzle material |
| Keeper costume | ochre/yellow oilskin | silhouette must remain visible in dark scenes |

## Character Presentation

### The Keeper

- Weathered ochre oilskin coat with dark boots and gloves.
- Brass lantern held low enough to cast dramatic upward light.
- Practical silhouette: hood, coat hem, lantern, and Beacon Rod/Flare Lance.
- Animations should feel human and weighted, especially on stairs, ledges, and after scares.

### The Detached Shadow

- Sleek smoky body, readable even against dark backgrounds through subtle rim light.
- White rim-eyes, not expressive cartoon eyes.
- Crystalline accents appear only when reflecting or refracting light.
- Idle motion should be barely controlled, like smoke pulled by a tether.

## Environment Presentation

### Lighthouse Interior

Cold wet stone, brass machinery, lens fragments, spiral stairs, dripping windows, and candles fighting drafts. The opening should make the lighthouse feel vertical, old, and underpowered. The original lighthouse should show its purpose as a warning machine: old plaques, reef maps, crystal housings, and marks from generations of keepers who maintained the beacon.

### Storm-Lashed Pier

Flooded planks, swinging lamps, ropes, cracked boats, foam, and broken relay hardware. Use strong foreground rain streaks and distant silhouettes to sell depth. Under-pier spaces should be dark enough that cries for help feel plausible before the scare reveals something unnatural.

### Crystal Sea Caves & Sunken Chapel

Wet stone, shallow reflective water, stained glass debris, and exposed crystal clusters. This is where the visual language shifts from survival horror into mystery and discovery. Add old lighthouse-origin clues here: carved crystal channels, broken warning bells, keeper tally marks, and chapel glass that catches the lantern before anything else moves.

### Cliffside Ascent

High wind, exposed scaffolding, broken beacon infrastructure, and lightning silhouettes. The final climb should echo the opening lighthouse shot but add urgency and clearer rescue light. Late-game scares should use empty spaces behind the player, clean radio light, and sudden silhouettes at the edge of lightning flashes.

## Opening Cutscene Storyboard

1. Ocean wide shot: rolling black water, lighthouse barely visible.
2. Cliff push-in: lighthouse tower dark, rain passing close to camera.
3. Lantern room interior: Keeper framed small beneath the dead lens.
4. Radio close-up: tuning needle jitters, speaker cloth vibrates.
5. Wall shadow: lightning reveals impossible movement.
6. Radio wrongness: the speaker whispers the Keeper's name while the needle drops to zero.
7. Shadow separation: silhouette peels away from the Keeper's feet.
8. Lens room scare: one violent impact above shakes dust through the lantern beam.
9. Lantern flare: warm light blooms, cutting to player control.

## UI & Presentation Notes

- Radio UI should feel analog: tuning needle, speaker glow, frequency markings, and static flicker.
- Avoid clean futuristic HUD styling.
- Story text should be minimal; radio audio and environmental art should carry narrative.
- Checkpoint relay activation should be a presentation moment: sparks, clearing static, light traveling through cable or crystal, then a radio voice.
- Jump scares should be built visually before they hit: a still frame, a wrong reflection, a gap under the pier, a door that should not move, or a silhouette that disappears when the lantern turns.

## Asset Folder Plan

Use the existing art directories for final assets:

- `assets/characters/` for Keeper and Shadow concept/model files.
- `assets/environment/` for lighthouse, pier, cave, chapel, and cliffside kits.
- `assets/effects/` for rain, fog, lantern glow, crystal glints, and darkness materials.
- `assets/textures/` for tiling stone, wet wood, brass, glass, oilskin, and crystal surfaces.
- `assets/fonts/` for readable UI fonts if a custom typeface is selected.

Use `assets/presentation/` for concept boards, storyboard images, UI mockups, and pitch visuals.
