import { themeFor } from './theme.js';
import { fixedLayerOffset } from '../rendering.js';

// Depth for every level: the painted backdrop comes in four layers that
// scroll at different speeds, so far things drift slowly and near things
// rush past. Owner: Lucas (graphics).
//
//   layer   scroll   what's in it                         file
//   sky       .12    gradient, stars, haze                <id>-sky.svg
//   far       .35    distant hills, cliffs, arches         <id>-far.svg
//   near      .65    trees, pillars, lenses, light shafts  <id>-near.svg
//   ground   1.00    platforms and set pieces              <id>.svg
//
// The ground layer must scroll with the camera (1.00): its ledges line up
// with the collision boxes. The art is made by scripts/generate_*_art.mjs.
//
// A faint wash of the area's fog colour sits between the layers, so the
// further back something is, the more it fades into the air.
const LAYERS = [
  { key: 'sky', scroll: .12, depth: -14, resolution: .5 },
  { key: 'far', scroll: .35, depth: -13, resolution: .75, haze: .1 },
  { key: 'near', scroll: .65, depth: -12, resolution: 1, haze: .07 },
  { key: 'ground', scroll: 1, depth: -10, resolution: 1 },
];

// Every backdrop SVG, by file name (e.g. "storm-coast-sky.svg" → url).
const ART = Object.fromEntries(Object.entries(
  import.meta.glob('../../assets/environment/**/*.svg', { query: '?url&no-inline', import: 'default', eager: true }),
).map(([path, url]) => [path.split('/').pop(), url]));

const textureKey = (stage, layer) => `backdrop-${stage.id}-${layer}`;
const fileName = (stage, layer) => layer === 'ground' ? `${stage.id}.svg` : `${stage.id}-${layer}.svg`;

/** Queue this level's layers for loading (call from the scene's preload). */
export function preloadParallax(scene, stage) {
  for (const { key, resolution } of LAYERS) {
    const url = ART[fileName(stage, key)];
    const texture = textureKey(stage, key);
    // Smooth, far-away layers load at lower resolution to save memory.
    if (url && !scene.textures.exists(texture)) scene.load.svg(texture, url, { scale: resolution });
  }
}

/** Add the layers to the scene (call from create, before anything else). */
export function createParallax(scene) {
  const { stage, artScale: s, viewportWidth: vw, viewportHeight: h } = scene;
  freeOtherLevels(scene, stage);
  const theme = themeFor(stage);
  const artWidth = (stage.artWidth ?? stage.width) * s;
  // The slow layers are centred on the middle of the painted area: at that
  // camera position every layer lines up exactly as it was painted, so
  // landmarks near either end of the level still pass through view.
  const middle = Math.max(0, (Math.min(scene.worldWidth, artWidth) - vw) / 2);
  for (const { key, scroll, depth, haze } of LAYERS) {
    const texture = textureKey(stage, key);
    if (!scene.textures.exists(texture)) continue;
    const left = key === 'ground' ? 0 : Math.min(0, vw / 2 - artWidth / 2 + middle * scroll);
    scene.add.image(left, 0, texture).setOrigin(0).setDisplaySize(artWidth, h)
      .setScrollFactor(scroll, 1).setDepth(depth);
    if (haze) {
      const offset = fixedLayerOffset(vw, h);
      scene.add.rectangle(offset.x + vw / 2, offset.y + h / 2, vw, h, theme.fog, haze)
        .setScrollFactor(0).setDepth(depth - .5);
    }
  }
}

// Backdrops are large textures; keep only the current level's in memory.
function freeOtherLevels(scene, stage) {
  for (const key of scene.textures.getTextureKeys()) {
    if (key.startsWith('backdrop-') && !key.startsWith(`backdrop-${stage.id}-`)) scene.textures.remove(key);
  }
}
