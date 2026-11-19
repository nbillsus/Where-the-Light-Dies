# Chapter 1 — The Signal: level design

This file records the current browser prototype route. The target chapter is a connected 20–30 minute experience. The current playable pass establishes the route and core interactions; pacing, narrative scenes, audio, and puzzle depth still need team review.

## Progression

| Area | Primary lesson | Current playable beat |
| --- | --- | --- |
| Storm Coast | Movement and timing | Cross broken ledges, a collapsing bridge, and a moving tidal lift; glimpse a distant figure. |
| Abandoned Facility | Environmental mechanisms | Push a crate onto a mass plate, operate ignition before routing, and cross a timed bypass gate. |
| Thornwood | Shadow introduction | Detach the pale shadow, anchor it at a seal to open a gate, then send it ahead to form a bridge. |
| Drowned Cavern | Combine shadow and machinery | Hold one prism with the shadow, align a lever, then anchor the shadow at a second prism. |
| Lantern Vault | Chapter finale | Hold a weight plate, anchor the shadow in the receiver, operate the release switch, and enter the final signal. |

The Coast and Facility use only the boy. The shadow is introduced in the Thornwood so players learn movement and object interaction first. All five areas use a long side-scrolling composition. Their visible ledges and collision surfaces share coordinates in `src/levels/chapterData.js`; scene-specific mechanisms are in `src/gameplay/ChapterMechanics.js`.

## Puzzle and checkpoint notes

- The Coast's moving lift spans its largest gap. The bridge falls after the boy steps on it. The distant figure is a short visual cue, not an enemy encounter.
- The Facility's first gate opens once the crate rests on its plate. The second gate needs the ignition and routing switches in that order. The last gate is timed, and latches open after the boy crosses.
- In the Thornwood, an anchored shadow opens the first gate. The far seal creates a physical bridge across the last large gap. Neither puzzle restricts shadow travel distance.
- In the Cavern, the first prism holds a gate open. Beyond it, the player aligns a lever and moves the shadow to a second prism. The rotating spotlight is currently a visual cue for later light puzzles.
- The Vault combines a crate, a shadow receiver, and a switch. The release opens the final gate and triggers the relay sequence. The ending deliberately leaves the source of the signal unresolved.
- Reaching a ledge makes it the next respawn point. Restarting an area resets its mechanisms. The prototype has no save system yet.

## Art and presentation

The chapter backgrounds are original vector illustrations generated from `scripts/generate_parkour_art.mjs`. They are designed to stay sharp when the browser fills the screen. Cinematic title pulses mark area changes, the shadow awakening, and relay activation. The final lens sequence is the chapter cliffhanger. These are starting points for richer animation and sound work.

## Team integration

The browser shadow behavior is isolated in `src/gameplay/ShadowController.js`, and puzzles only ask whether it is anchored near a receiver. That interface lets the shadow specialist change its visuals and movement without rewriting level layouts. Story text here is provisional and should be reconciled with `docs/STORY.md` before publication.
