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
    width: 4096, height: 900, shadow: true,
    platforms: [
      [0, 620, 735], [755, 1135, 685], [1270, 1635, 635],
      [1770, 2135, 690], [2270, 2630, 620], [2765, 3115, 665],
      [3250, 3610, 610], [3745, 4096, 660],
    ],
  },
];
