// Where enemies stand in each area: which platform (index into the area's
// platform list in src/levels/chapterData.js) and how far along it (`at`,
// 0–1), or an exact `x` in art units.
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
    { type: 'skitterer', platform: 6, x: 3850 }, { type: 'skitterer', platform: 6, x: 3950 }, { type: 'skitterer', platform: 6, x: 4050 },
  ],
  // Chapter 3 — patrols avoid the collapsing shelves and lens fixtures.
  'moonbreak-reef': [{ type: 'skitterer', platform: 1, at: .45 }, { type: 'warden', platform: 4, at: .65 }],
  'glass-tide': [{ type: 'skitterer', platform: 2, at: .55 }, { type: 'warden', platform: 5, at: .6 }],
  'ash-orchard': [{ type: 'skitterer', platform: 3, at: .7 }, { type: 'warden', platform: 5, at: .55 }],
  'hollow-observatory': [{ type: 'skitterer', platform: 1, at: .45 }, { type: 'warden', platform: 5, at: .55 }],
  'black-lens': [{ type: 'skitterer', platform: 5, at: .5 }, { type: 'warden', platform: 6, x: 3920 }],
  // Chapters 4 and 5 ramp up the same enemy families between mechanisms.
  'sunken-archive': [{ type: 'skitterer', platform: 2, at: .45 }, { type: 'warden', platform: 4, at: .5 }],
  'bone-conduit': [{ type: 'warden', platform: 2, at: .65 }, { type: 'skitterer', platform: 5, at: .65 }],
  'mirror-well': [{ type: 'skitterer', platform: 3, at: .65 }, { type: 'warden', platform: 5, at: .5 }],
  'silent-engine': [{ type: 'warden', platform: 2, at: .55 }, { type: 'skitterer', platform: 5, at: .65 }],
  'deep-transmitter': [{ type: 'skitterer', platform: 2, at: .65 }, { type: 'warden', platform: 5, at: .55 }],
  'last-shore': [{ type: 'skitterer', platform: 2, at: .65 }, { type: 'warden', platform: 5, at: .55 }],
  'split-signal': [{ type: 'warden', platform: 2, at: .6 }, { type: 'skitterer', platform: 5, at: .55 }],
  'red-cathedral': [{ type: 'skitterer', platform: 2, at: .65 }, { type: 'warden', platform: 5, at: .55 }],
  'night-array': [{ type: 'warden', platform: 2, at: .55 }, { type: 'skitterer', platform: 5, at: .6 }],
  'threshold': [{ type: 'skitterer', platform: 2, at: .65 }, { type: 'warden', platform: 5, at: .55 }],
};
