// Where enemies stand in each area: which platform (index into the area's
// platform list in src/levels/chapterData.js) and how far along it (0–1).
// Kept away from puzzle objects and timed runs. Neel: move freely.
export const PLACEMENTS = {
  // Chapter 1 — Skitterers are introduced gently, Wardens from the Cavern on.
  'storm-coast': [
    { type: 'skitterer', platform: 2, at: .45 }, { type: 'skitterer', platform: 2, at: .7 },
    { type: 'skitterer', platform: 5, at: .35 }, { type: 'skitterer', platform: 5, at: .55 }, { type: 'skitterer', platform: 5, at: .75 },
  ],
  'abandoned-facility': [
    { type: 'skitterer', platform: 2, at: .3 }, { type: 'skitterer', platform: 2, at: .55 }, { type: 'skitterer', platform: 2, at: .8 },
  ],
  thornwood: [
    { type: 'skitterer', platform: 1, at: .5 }, { type: 'skitterer', platform: 1, at: .75 },
    { type: 'skitterer', platform: 4, at: .3 }, { type: 'skitterer', platform: 4, at: .55 }, { type: 'skitterer', platform: 4, at: .8 },
  ],
  'drowned-cavern': [
    { type: 'warden', platform: 4, at: .55 },
    { type: 'skitterer', platform: 1, at: .5 }, { type: 'skitterer', platform: 1, at: .75 },
  ],
  'lantern-vault': [
    { type: 'skitterer', platform: 1, at: .4 }, { type: 'skitterer', platform: 1, at: .6 }, { type: 'skitterer', platform: 1, at: .8 },
    { type: 'warden', platform: 3, at: .6 },
  ],
  // Chapter 2 — mixed groups.
  'red-descent': [
    { type: 'skitterer', platform: 4, at: .3 }, { type: 'skitterer', platform: 4, at: .5 }, { type: 'skitterer', platform: 4, at: .7 },
    { type: 'warden', platform: 5, at: .55 },
  ],
  'ossuary-works': [
    { type: 'skitterer', platform: 2, at: .3 }, { type: 'skitterer', platform: 2, at: .55 }, { type: 'skitterer', platform: 2, at: .8 },
    { type: 'warden', platform: 6, at: .5 },
  ],
  'crimson-array': [
    { type: 'warden', platform: 3, at: .5 },
    { type: 'skitterer', platform: 4, at: .3 }, { type: 'skitterer', platform: 4, at: .5 }, { type: 'skitterer', platform: 4, at: .7 },
  ],
  'bloodglass-chamber': [
    { type: 'warden', platform: 1, at: .6 },
    { type: 'skitterer', platform: 5, at: .3 }, { type: 'skitterer', platform: 5, at: .5 }, { type: 'skitterer', platform: 5, at: .7 },
  ],
  'heart-of-works': [
    { type: 'warden', platform: 2, at: .55 },
    { type: 'skitterer', platform: 6, at: .3 }, { type: 'skitterer', platform: 6, at: .45 }, { type: 'skitterer', platform: 6, at: .6 },
  ],
};
