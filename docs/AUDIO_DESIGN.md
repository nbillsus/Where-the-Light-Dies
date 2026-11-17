# Where the Light Dies - Audio Design

## Audio Goals

The soundscape should make the island feel alive before enemies appear. Rain, timber, distant horns, radio static, and the Shadow's whisper layer carry most of the horror mood. Music should stay restrained so that mechanical and environmental cues remain readable during puzzles.

## Mix Priorities

1. Gameplay confirmation cues: crystal lock-on, relay restore, lantern flare, Shadow recall.
2. Immediate threat cues: nearby dark movement, enemy rushes, low-health darkness pressure.
3. Radio transmissions and story audio.
4. Ambient weather and location beds.
5. Sparse musical texture.

## Ambience Layers

### Lighthouse Interior

- Muffled rain on glass and stone.
- Old timber creaks.
- Small lantern flame movement.
- Occasional metal chain sway from the upper lens room.

### Storm-Lashed Pier

- Heavy exterior rain.
- Wave impacts under the dock.
- Rope strain and boat hull knocking.
- Distant foghorn, never perfectly rhythmic.

### Crystal Sea Caves

- Dripping water with long reflections.
- Low resonant crystal hum.
- Subtle glassy ticks when beams move nearby.
- Distant chapel bell tone, almost hidden in the ambience.

### Cliffside Ascent

- High wind gusts.
- Lightning pre-rumble and crack.
- Loose stones shifting.
- Rescue vessel horn clearer as the player nears the climax.

## Radio Soundscape

Radio quality should improve after each restored relay.

| Stage | Static | Voice Clarity | Treatment |
| --- | --- | --- | --- |
| Prologue | Very high | Broken phrases only | narrow band, hard clipping, tuning drift |
| Act 1 | High | Mostly understandable | rain bleed, intermittent dropouts |
| Act 2 | Medium | Clear archived log | tape flutter, softened highs |
| Act 3 | Low | Direct contact | wide enough to feel immediate, static drops for final line |

## Gameplay Cues

| Cue | Sound Direction | Player Meaning |
| --- | --- | --- |
| Shadow detach | soft body-whoosh, reversed breath, low whisper swell | control has shifted or is about to shift |
| Shadow recall | quick snap of air and lantern-glass shimmer | Shadow is safely back |
| Solidify platform | smoky pressure thud with muted stone transient | Shadow can be stood on |
| Crystal refraction hit | sharp glass chime plus focused hum | beam is correctly aligned |
| Invalid beam angle | dull glass scrape, no chime | player needs a different angle |
| Relay restore | electrical cough into warm tonal bloom | checkpoint/story progress |
| Lantern flare | brass click, flame surge, short bright hiss | safety or combat pulse activated |

## Music Direction

Use low, slow harmonic movement rather than melody-heavy tracks. The score should feel like pressure from the storm and the tower, not a constant soundtrack.

- Prologue: near-silence, single bowed-metal tone under radio static.
- Act 1: low strings or synth drone pulsing with waves.
- Act 2: glass harmonics and distant choir-like texture.
- Act 3: restrained rhythmic pulse that rises only during the beacon climb.

## Asset Naming Convention

Use lowercase snake_case names grouped by function.

- `amb_lighthouse_interior_loop.wav`
- `amb_pier_storm_loop.wav`
- `amb_crystal_caves_loop.wav`
- `sfx_shadow_detach_01.wav`
- `sfx_shadow_recall_01.wav`
- `sfx_crystal_lock_01.wav`
- `sfx_relay_restore_01.wav`
- `radio_prologue_distress_v01.wav`
- `radio_act1_caldera_v01.wav`
- `music_act3_beacon_climb_loop.wav`

## Implementation Handoff

Audio should be delivered as individual loops and one-shots. This document does not define code behavior; it defines what assets should exist and what each sound should communicate when a teammate wires it into gameplay.
