// Small runtime-generated textures for glows, fog and particles, so the
// game needs no extra image files for its effects.

function canvasTexture(scene, key, width, height, draw) {
  if (scene.textures.exists(key)) return;
  const texture = scene.textures.createCanvas(key, width, height);
  draw(texture.getContext(), width, height);
  texture.refresh();
}

function radial(ctx, w, h, stops) {
  const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.min(w, h) / 2);
  for (const [offset, alpha] of stops) gradient.addColorStop(offset, `rgba(255,255,255,${alpha})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

export function ensureFxTextures(scene) {
  // Soft round light: tinted and added on top of things that glow.
  canvasTexture(scene, 'fx-glow', 128, 128, (ctx, w, h) => radial(ctx, w, h, [[0, 1], [.22, .55], [.55, .14], [1, 0]]));
  // Very soft blob for fog banks.
  canvasTexture(scene, 'fx-fog', 256, 256, (ctx, w, h) => radial(ctx, w, h, [[0, .55], [.5, .22], [1, 0]]));
  // Tiny particle.
  canvasTexture(scene, 'fx-mote', 16, 16, (ctx, w, h) => radial(ctx, w, h, [[0, 1], [.45, .6], [1, 0]]));
  // Rain streak.
  canvasTexture(scene, 'fx-rain', 4, 48, (ctx, w, h) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, 'rgba(255,255,255,.9)');
    ctx.fillStyle = gradient;
    ctx.fillRect(1, 0, 2, h);
  });
}

// Small deterministic random generator so decorations look the same every visit.
export function seededRandom(text) {
  let seed = 2166136261;
  for (const char of text) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  return () => {
    seed = (seed + 0x6D2B79F5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
