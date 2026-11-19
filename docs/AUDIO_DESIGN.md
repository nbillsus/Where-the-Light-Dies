# Where the Light Dies - Audio Design

## Audio Goals

The soundscape should make the island feel alive before enemies appear. Rain, timber, distant horns, radio static, copied cries for help, and the Shadow's whisper layer carry most of the horror mood. Music should stay restrained during puzzles, then tighten into suspense before scripted scares.

## Mix Priorities

1. Gameplay confirmation cues: crystal lock-on, relay restore, lantern flare, Shadow recall.
2. Jump-scare stingers and immediate threat cues: nearby dark movement, sudden impacts, enemy rushes, low-health darkness pressure.
3. Radio transmissions, cries for help, and story audio.
4. Suspense music buildup.
5. Ambient weather and location beds.

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

False cries should become more convincing as the radio system improves. Early false voices should sound watery and distant. Late false voices should sound dry, close, and personal, as if they are in the same room as the player.

## Suspense & Jump-Scare Audio Plan

Jump scares should have a clear three-part audio shape: warning, pressure, release.

1. Warning: remove one familiar ambience layer, such as rain or lantern flame.
2. Pressure: introduce a low pulse, rising string scrape, reversed breath, or quiet cry for help.
3. Release: trigger a sharp, short scare sound with a visual event.

Avoid using the same stinger repeatedly. Each scare should have a signature sound connected to the location.

| Story Moment | Buildup Music | Scare Sound | Follow-Up |
| --- | --- | --- | --- |
| Lens room knock | near silence, single low bowed tone | heavy wood/metal slam above the player | dust fall, radio cuts dead |
| Cry beneath pier | slow heartbeat kick under dock creaks | wet hand slap through boards | cry repeats in Keeper's voice |
| Chapel reflection | glass harmonics bending out of tune | shrieking glass scrape, fast inhale | delayed reflection whisper |
| Help from behind | tight rising drone under wind | close dry whisper plus sub hit | storm returns too loud |

## Cry For Help Voice System

The cries for help are story audio assets, not random barks. They should change based on the player's progress through the story.

| Phase | Voice Source | Delivery |
| --- | --- | --- |
| Prologue | unknown whisper | almost silent, close to the radio |
| Act 1 | person under pier | muffled, wet, distant below the player |
| Act 2 | copied Keeper voice | delayed, reflected, mixed with glass tones |
| Act 3 | false distress call | clean and intimate, then distorted into static |

Suggested recorded lines:

- `voice_keeper_is_someone_up_there_01.wav`
- `voice_keeper_stay_in_the_light_01.wav`
- `voice_lure_help_me_lantern_01.wav`
- `voice_lure_under_pier_01.wav`
- `voice_keeper_not_my_reflection_01.wav`
- `voice_keeper_knows_my_voice_01.wav`
- `voice_false_keeper_still_down_here_01.wav`
- `voice_keeper_keep_burning_01.wav`

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
| Jump scare sting | location-specific impact plus short sub drop | sudden story scare or threat reveal |
| False help cry | human voice with water/radio artifacts | lure, warning, or story reveal |

## Music Direction

Use low, slow harmonic movement rather than melody-heavy tracks. The score should feel like pressure from the storm and the tower, not a constant soundtrack.

- Prologue: near-silence, single bowed-metal tone under radio static.
- Act 1: low strings or synth drone pulsing with waves.
- Act 2: glass harmonics and distant choir-like texture.
- Act 3: restrained rhythmic pulse that rises only during the beacon climb.
- Jump-scare buildups: short suspense cues that can fade in under ambience and cut hard on the scare.

## Asset Naming Convention

Use lowercase snake_case names grouped by function.

- `amb_lighthouse_interior_loop.wav`
- `amb_pier_storm_loop.wav`
- `amb_crystal_caves_loop.wav`
- `sfx_shadow_detach_01.wav`
- `sfx_shadow_recall_01.wav`
- `sfx_crystal_lock_01.wav`
- `sfx_relay_restore_01.wav`
- `sfx_jumpscare_lens_knock_01.wav`
- `sfx_jumpscare_pier_hand_01.wav`
- `radio_prologue_distress_v01.wav`
- `radio_act1_caldera_v01.wav`
- `voice_false_keeper_still_down_here_01.wav`
- `music_suspense_pier_buildup_loop.wav`
- `music_act3_beacon_climb_loop.wav`

## Implementation Handoff

Audio should be delivered as individual loops and one-shots. This document does not define code behavior; it defines what assets should exist and what each sound should communicate when a teammate wires it into gameplay.
