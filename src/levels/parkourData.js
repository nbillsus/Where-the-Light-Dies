// Coordinates are in the 4096 × 900 background artwork. The same ledge data
// drives both the painted platforms and their collision bodies.
export const PARKOUR_STAGES = [
  {
    id: 'thornwood',
    title: 'THE THORNWOOD',
    width: 4096,
    height: 900,
    platforms: [
      [0, 640, 735], [775, 1160, 685], [1295, 1675, 650],
      [1810, 2175, 705], [2315, 2695, 655], [2835, 3220, 620],
      [3360, 3720, 690], [3850, 4096, 655],
    ],
  },
  {
    id: 'drowned-cavern',
    title: 'THE DROWNED CAVERN',
    width: 4096,
    height: 900,
    platforms: [
      [0, 580, 735], [710, 1060, 690], [1195, 1535, 630],
      [1670, 2030, 680], [2170, 2500, 615], [2635, 2980, 655],
      [3115, 3470, 600], [3605, 4096, 670],
    ],
  },
  {
    id: 'lantern-vault',
    title: 'THE LANTERN VAULT',
    width: 4096,
    height: 900,
    platforms: [
      [0, 620, 735], [755, 1135, 685], [1270, 1635, 635],
      [1770, 2135, 690], [2270, 2630, 620], [2765, 3115, 665],
      [3250, 3610, 610], [3745, 4096, 660],
    ],
  },
];
