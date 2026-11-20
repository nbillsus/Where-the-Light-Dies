// All positions use the 4096 × 900 art coordinates. The art generator and
// gameplay read the same platforms so visible ledges match their collision.
export const CHAPTER_STAGES = [
  {
    id: 'storm-coast', title: 'THE STORM COAST', phase: 'THE COAST',
    subtitle: 'The lighthouse fades behind you. Follow the dead relay lights.',
    width: 4096, height: 900, shadow: false,
    platforms: [
      [0, 720, 735], [835, 1320, 710], [1450, 1810, 655],
      [1940, 2265, 700], [2680, 2980, 675], [3110, 3490, 625],
      [3630, 4096, 675],
    ],
  },
  {
    id: 'abandoned-facility', title: 'THE ABANDONED FACILITY', phase: 'THE FACILITY',
    subtitle: 'Three mechanisms stand between you and the old service road.',
    width: 4096, height: 900, shadow: false,
    platforms: [
      [0, 950, 735], [1080, 1460, 695], [1580, 2080, 650],
      [2200, 2610, 690], [2740, 3180, 650], [3310, 3660, 620],
      [3780, 4096, 670],
    ],
  },
  {
    id: 'thornwood', title: 'THE THORNWOOD', phase: 'THE FOREST',
    subtitle: 'Something walks beside you, though the light is behind.',
    width: 4096, height: 900, shadow: true,
    platforms: [
      [0, 640, 735], [775, 1160, 685], [1295, 1675, 650],
      [1810, 2175, 705], [2315, 2695, 655], [2835, 3200, 620],
      [3630, 3820, 690], [3920, 4096, 655],
    ],
  },
  {
    id: 'drowned-cavern', title: 'THE DROWNED CAVERN', phase: 'BELOW',
    subtitle: 'The old lenses answer a light that no longer exists.',
    width: 4096, height: 900, shadow: true,
    platforms: [
      [0, 580, 735], [710, 1060, 690], [1195, 1535, 630],
      [1670, 2030, 680], [2170, 2500, 615], [2635, 2980, 655],
      [3115, 3470, 600], [3605, 4096, 670],
    ],
  },
  {
    id: 'lantern-vault', title: 'THE LANTERN VAULT', phase: 'THE REVELATION',
    subtitle: 'One last relay. One impossible signal.',
    // The last ledge runs on into a boss arena (art beyond 4096 is drawn in code).
    width: 5900, artWidth: 4096, height: 900, shadow: true,
    arena: { start: 4300, boss: 'hollow' },
    platforms: [
      [0, 620, 735], [755, 1135, 685], [1270, 1635, 635],
      [1770, 2135, 690], [2270, 2630, 620], [2765, 3610, 665],
      [3745, 5900, 660],
    ],
  },
  ...[
    ['red-descent', 'THE RED DESCENT', 'THE DESCENT', 'A second signal bleeds through the rock.',
      [[0,720,735],[835,1300,700],[1430,1890,665],[2020,2470,710],[2600,3050,665],[3180,3590,630],[3720,4096,680]]],
    ['ossuary-works', 'THE OSSUARY WORKS', 'THE WORKS', 'The machines kept working long after their makers vanished.',
      [[0,720,735],[850,1350,690],[1480,1940,655],[2070,2530,700],[2660,3110,650],[3240,3650,620],[3780,4096,675]]],
    ['crimson-array', 'THE COLD ARRAY', 'THE ARRAY', 'The cold beams are searching for a shape they remember.',
      [[0,700,735],[830,1280,695],[1410,1880,650],[2010,2470,700],[2600,3070,650],[3200,3630,625],[3760,4096,675]]],
    ['bloodglass-chamber', 'THE BLOODGLASS CHAMBER', 'THE CHAMBER', 'In every pane, your shadow is a second too late.',
      [[0,720,735],[850,1310,690],[1440,1900,650],[2030,2490,700],[2620,3070,650],[3200,3650,625],[3780,4096,675]]],
    ['heart-of-works', 'THE HEART OF THE WORKS', 'THE HEART', 'The machine calls for two hands. One of them is yours.',
      [[0,720,735],[850,1320,690],[1450,1900,650],[2030,2500,700],[2630,3090,650],[3220,3650,625],[3780,5900,675],
        // These ledges carry the two shield receptors. Their heights form a
        // reachable staircase from the arena floor at every normal viewport.
        [4420,4660,585],[5000,5240,510]]],
  ].map(([id, title, phase, subtitle, platforms], index) => ({
    id, title, phase, subtitle, platforms, width: 4096, height: 900,
    shadow: true, grasp: [0, 3, 4].includes(index), chapter: 2,
    // The final area runs on into a boss arena.
    ...(index === 4 ? { width: 5900, artWidth: 4096, arena: { start: 4300, boss: 'heart' } } : {}),
  })),
  ...[
    ['moonbreak-reef', 'THE MOONBREAK REEF', 'THE REEF', 'The first lens answers only the shadow.',
      [[0,720,735],[850,1320,700],[1450,1940,650],[2070,2560,700],[2690,3150,655],[3280,3710,625],[3840,4096,675]]],
    ['glass-tide', 'THE GLASS TIDE', 'THE TIDE', 'Buried glass catches a beam beneath the waves.',
      [[0,760,735],[890,1400,690],[1530,2010,645],[2140,2620,695],[2750,3200,650],[3330,3740,625],[3870,4096,675]]],
    ['ash-orchard', 'THE ASH ORCHARD', 'THE ORCHARD', 'Every branch points toward an absent sun.',
      [[0,680,735],[810,1270,690],[1400,1860,650],[1990,2450,705],[2580,3020,655],[3150,3580,625],[3710,4096,675]]],
    ['hollow-observatory', 'THE HOLLOW OBSERVATORY', 'THE OBSERVATORY', 'The old astronomers watched the dark between stars.',
      [[0,750,735],[880,1360,695],[1490,1950,650],[2080,2550,700],[2680,3130,655],[3260,3700,625],[3830,4096,675]]],
    ['black-lens', 'THE BLACK LENS', 'THE LENS', 'Turn the light toward the thing that follows you.',
      [[0,720,735],[850,1320,695],[1450,1910,650],[2040,2500,700],[2630,3070,650],[3200,3650,625],[3780,4096,675]]],
  ].map(([id, title, phase, subtitle, platforms], index) => ({
    id, title, phase, subtitle, platforms, width: 4096, height: 900,
    shadow: true, grasp: [3, 4].includes(index), reflection: true, chapter: 3,
  })),
];
