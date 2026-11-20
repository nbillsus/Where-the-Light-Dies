// Per-area look: ink colour, rim light, fog, particles and decoration sets.
// `ambient` is how much light reaches the dark parts of the screen (the light
// map multiplies the scene by it); `lantern` is the colour of the boy's light;
// `sky` is how much moonlight reaches the top of the screen (default .2).
// Owner: Lucas (graphics). Colours follow the PRD: warm amber means safety
// and interaction, cold slate-blue is the storm, near-black is threat.

const CHAPTER_ONE = {
  'storm-coast': {
    ambient: 0x2e3c56, lantern: 0xffd9a0, sky: .3,
    ink: 0x040a14, rim: 0x9fd4e6, drip: 0x7fb6cc, fog: 0x8fb2d6, fogAlpha: .16,
    motes: { kind: 'spray', color: 0xcfe6f2 }, weather: 'rain',
    hang: 'moss', bottom: ['grass', 'rocks'], top: [],
    accent: 0xf6c874, saturate: -.12,
  },
  'abandoned-facility': {
    ambient: 0x2a3c3e, lantern: 0xffd59a,
    ink: 0x030d0e, rim: 0x8fd0c8, drip: 0x9a6a3c, fog: 0x7fb3ad, fogAlpha: .13,
    motes: { kind: 'dust', color: 0xd8e6dc }, weather: null,
    hang: 'rust', bottom: ['rubble', 'grass'], top: ['pipes', 'cables'],
    accent: 0xf6c874, saturate: -.18,
  },
  thornwood: {
    ambient: 0x342c46, lantern: 0xffd8b0,
    ink: 0x0a0510, rim: 0xc6b0e6, drip: 0x7d6a94, fog: 0x9d86c4, fogAlpha: .15,
    motes: { kind: 'spores', color: 0xd9c8ff }, weather: null,
    hang: 'roots', bottom: ['thorns', 'grass'], top: ['branches'],
    accent: 0xc9b2ff, saturate: -.1,
  },
  'drowned-cavern': {
    ambient: 0x22393d, lantern: 0xffdcaa,
    ink: 0x020c0e, rim: 0x9de3dc, drip: 0x8fe0d8, fog: 0x77c4bf, fogAlpha: .14,
    motes: { kind: 'drips', color: 0xb8f2ec }, weather: null,
    hang: 'moss', bottom: ['rocks', 'grass'], top: ['stalactites', 'roots'],
    accent: 0x9ce6e0, saturate: -.1,
  },
  'lantern-vault': {
    ambient: 0x3a2c22, lantern: 0xffcf8a,
    ink: 0x0d0804, rim: 0xf0cf96, drip: 0xb98a52, fog: 0xd9b07a, fogAlpha: .12,
    motes: { kind: 'embers', color: 0xffc77a }, weather: null,
    hang: 'roots', bottom: ['rubble', 'candles'], top: ['chains', 'stalactites'],
    accent: 0xf6c874, saturate: -.08,
  },
};

const CHAPTER_TWO = {
  ambient: 0x4c1a22, lantern: 0xffd6a0, sky: .26,
  ink: 0x0c0306, rim: 0xe8a39a, drip: 0xb8343a, fog: 0xa83a44, fogAlpha: .12,
  motes: { kind: 'ash', color: 0xff9a7c }, weather: null,
  hang: 'rust', bottom: ['spikes', 'rubble'], top: ['ribs', 'chains'],
  accent: 0xffc984, danger: 0xf36a65, saturate: -.15,
};

const CHAPTER_THREE = {
  'moonbreak-reef': { ambient: 0x46607a, lantern: 0xffe2b0, sky: .32, ink: 0x06121a, rim: 0xa7d8e9, drip: 0x6596a5, fog: 0x73adbd, fogAlpha: .12,
    motes: { kind: 'spray', color: 0xd3f5f4 }, weather: 'rain', hang: 'moss', bottom: ['rocks', 'grass'], top: [], accent: 0xb8e8eb, saturate: -.04 },
  'glass-tide': { ambient: 0x3a6264, lantern: 0xffe0b0, sky: .3, ink: 0x06151b, rim: 0x8adbc9, drip: 0x6caaa5, fog: 0x63beb7, fogAlpha: .12,
    motes: { kind: 'drips', color: 0xbaf7e5 }, weather: null, hang: 'moss', bottom: ['rocks', 'grass'], top: [], accent: 0x8bdbcb, saturate: -.03 },
  'ash-orchard': { ambient: 0x5a4a3a, lantern: 0xffd9a0, sky: .3, ink: 0x16100b, rim: 0xe1c194, drip: 0x876d54, fog: 0xc5a37a, fogAlpha: .14,
    motes: { kind: 'ash', color: 0xf8dcc0 }, weather: null, hang: 'roots', bottom: ['grass', 'rubble'], top: ['branches'], accent: 0xe9c49c, saturate: -.06 },
  'hollow-observatory': { ambient: 0x463f66, lantern: 0xffdcb4, sky: .3, ink: 0x0c0a1b, rim: 0xc2b4e9, drip: 0x847bac, fog: 0x9589bc, fogAlpha: .11,
    motes: { kind: 'dust', color: 0xe2d8ff }, weather: null, hang: 'rust', bottom: ['rubble', 'candles'], top: ['cables'], accent: 0xc7adf5, saturate: -.03 },
  'black-lens': { ambient: 0x4c3f36, lantern: 0xffd59a, sky: .26, ink: 0x100d0e, rim: 0xe6c88c, drip: 0xa9805f, fog: 0xad8977, fogAlpha: .12,
    motes: { kind: 'embers', color: 0xffdb91 }, weather: null, hang: 'roots', bottom: ['rubble', 'candles'], top: ['chains'], accent: 0xf4d199, saturate: -.05 },
};

const DEEP_THEMES = {
  'sunken-archive': [0x071822, 0x8edbe4, 0x659eaa, 'drips', 'rust'],
  'bone-conduit': [0x1a100c, 0xf0ba83, 0x986e4b, 'ash', 'roots'],
  'mirror-well': [0x111329, 0xb5adf3, 0x686baf, 'dust', 'chains'],
  'silent-engine': [0x101b19, 0xbdd6a5, 0x658d78, 'dust', 'rust'],
  'deep-transmitter': [0x071d23, 0x9ce7e0, 0x498f8b, 'drips', 'cables'],
  'last-shore': [0x09192d, 0xc0e0f5, 0x688db6, 'spray', 'moss'],
  'split-signal': [0x1a0e23, 0xecb1da, 0x9b5e91, 'dust', 'chains'],
  'red-cathedral': [0x1c0d0d, 0xf0c093, 0x9b584a, 'embers', 'roots'],
  'night-array': [0x11112b, 0xb7c1fa, 0x6b6fae, 'dust', 'cables'],
  threshold: [0x090e19, 0xf3d7ab, 0xa5886d, 'embers', 'chains'],
};

export function themeFor(stage) {
  if (stage.chapter >= 4) {
    const [ink, rim, fog, kind, hang] = DEEP_THEMES[stage.id];
    return { ink, rim, drip: fog, fog, fogAlpha: .12, motes: { kind, color: rim }, weather: null,
      hang, bottom: ['rocks', 'rubble'], top: ['cables'], accent: rim, saturate: -.06 };
  }
  if (stage.chapter === 3) return { ...CHAPTER_THREE[stage.id] };
  if (stage.chapter === 2) return { ...CHAPTER_TWO };
  return { ...(CHAPTER_ONE[stage.id] ?? CHAPTER_ONE['storm-coast']) };
}
