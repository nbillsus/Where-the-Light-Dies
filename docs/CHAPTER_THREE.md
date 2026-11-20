# Chapter 3 — Reflection

The end of **The Heart of the Works** leads directly into five Chapter 3 areas. The Shadow can already run, jump, anchor, and grasp. This chapter adds lenses: move the Shadow into a lens and press `F` to hold its position. The lens captures the incoming beam and redirects it to a receiver. Captured reflections persist while the Shadow moves to another lens. A counter on each reflection gate shows how many lenses are aligned.

| Area | Visual direction | Main interaction |
| --- | --- | --- |
| Moonbreak Reef | Moonlit sea, spray, jagged reef markers | Learn one-lens reflection and open the first gate. |
| Glass Tide | Teal submerged glass spires | Push an ordinary wooden weight, then reflect a beam farther along the shore. |
| Ash Orchard | Warm ash, dead branching trees, absent sun | Build a two-lens chain and cross a pulsing beam hazard. |
| Hollow Observatory | Violet domes, old telescopes, cold glass | Use Grasp on a pale relic, then reflect light through the observatory. |
| Black Lens | Amber-black arches and a giant dark lens | Combine Grasp, three captured reflections, and a machinery lever. |

The stages use the same 4096 × 900 coordinate system as the first two chapters. SVG art is generated from the platform coordinates, so visible ledges follow collision ledges. `scripts/generate_chapter_three_art.mjs` regenerates the chapter backgrounds.

The story beats reveal that the reflectors preserve old light, the first keeper used the original signal as a warning, and the dark lens may carry light back toward the lighthouse. Chapter 3 ends on a short reveal card and a restart/menu choice; the next chapter is not implemented yet.
