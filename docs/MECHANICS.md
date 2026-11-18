# Mechanics

Owner: Lucas. These are the rules the code implements. Numbers come from
`scenes/player/keeper_tuning.tres`; if you change one there, update it here.

Units: metres, seconds, metres per second. The Keeper is 1.8 m tall.

## The Keeper: movement

| Rule | Value |
| --- | --- |
| Run speed | 5.0 m/s |
| Time to full speed on the ground | about 0.1 s |
| Air control | Can steer in the air, but slower than on the ground; keeps momentum when the stick is released |
| Full jump (hold) | 1.4 m high, 0.38 s to the top |
| Short hop (tap) | about 0.5 m: releasing jump early cuts the rise |
| Falling | 1.6× heavier than rising, top speed 20 m/s |
| Coyote time | Can still jump 0.1 s after running off an edge |
| Jump buffer | A jump pressed up to 0.12 s before landing happens on landing |

### Mantling

- Happens automatically when the Keeper is in the air and pushing toward a
  ledge whose top is **0.35–2.0 m above the Keeper's feet**.
- The Keeper only mantles if there is room to stand on top.
- Takes 0.28 s; no control during it.
- The Keeper can mantle onto level geometry, crates, and the Solidified Shadow.
- **Highest reachable ledge from flat ground: about 3.4 m** (1.4 m jump +
  2.0 m reach). Anything taller needs the Shadow. Level design rule: walls
  meant to need the Shadow should be **4 m or more**.

### Ladders

- Press **up** inside a ladder's zone to grab it; press **down** while
  standing on top of the platform to climb down.
- Climb speed 3.0 m/s.
- Climbing past the top steps the Keeper off onto the platform on the
  ladder's exit side.
- **Jump** lets go: a 60% jump toward the held direction (or away from the
  platform if no direction is held). The ladder can't be re-grabbed for 0.25 s.
- Reaching the floor while climbing down lets go.

### Push and pull

- Hold **interact** while standing next to a crate (within 0.45 m) and on
  the ground to grab it. Release interact to let go.
- Push speed 2.0 m/s, pull speed 1.6 m/s. The Keeper faces the crate while
  holding it and can't jump.
- Crates stop at walls and other crates, and fall under gravity. The Keeper
  lets go if the crate starts falling or the Keeper leaves the ground.
- Walking into a crate without holding interact does not move it.

### Control switching

While the player controls the Shadow, the Keeper ignores input and holds its
position (it still falls if unsupported).

## Building blocks for level design

Drop these scenes into levels; their behaviour is fixed by the rules above.

| Scene | What to set |
| --- | --- |
| `scenes/puzzles/ladder.tscn` | Origin at the bottom, about 0.5 m out from the platform edge. `height` = platform top; `exit_direction` = side the platform is on. |
| `scenes/puzzles/pushable_block.tscn` | Origin at the bottom centre. 1 × 1 × 1 m. |
| `scenes/player/keeper.tscn` | Origin at the feet, on Z = 0. |
