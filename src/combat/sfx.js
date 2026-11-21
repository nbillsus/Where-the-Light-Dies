// Placeholder combat sounds, synthesised so fights aren't silent.
// They play through Axel's horror audio mix (HorrorPresentation.master).
// Axel: replace these with real sounds by listening to the scene events
// documented in docs/MECHANICS.md ("Combat events").

function output(scene) {
  const horror = scene.horror;
  const ctx = horror?.ensureAudio?.();
  return ctx && horror.master ? { ctx, out: horror.master } : null;
}

function noiseBurst(ctx, out, { duration, from, to, gain, type = 'bandpass', q = 1.2, delay = 0 }) {
  const now = ctx.currentTime + delay;
  const length = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(from, now);
  filter.frequency.exponentialRampToValueAtTime(to, now + duration);
  const level = ctx.createGain();
  level.gain.setValueAtTime(gain, now);
  level.gain.exponentialRampToValueAtTime(.001, now + duration);
  source.connect(filter).connect(level).connect(out);
  source.start(now);
}

function tone(ctx, out, { from, to, duration, gain, type = 'sine', delay = 0 }) {
  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, now);
  osc.frequency.exponentialRampToValueAtTime(to, now + duration);
  const level = ctx.createGain();
  level.gain.setValueAtTime(gain, now);
  level.gain.exponentialRampToValueAtTime(.001, now + duration);
  osc.connect(level).connect(out);
  osc.start(now);
  osc.stop(now + duration + .02);
}

export const sfx = {
  swing(scene, step) {
    const a = output(scene); if (!a) return;
    noiseBurst(a.ctx, a.out, { duration: .16, from: 900 + step * 300, to: 3200, gain: .5, q: .8 });
  },
  hit(scene) {
    const a = output(scene); if (!a) return;
    tone(a.ctx, a.out, { from: 140, to: 50, duration: .18, gain: .9 });
    noiseBurst(a.ctx, a.out, { duration: .1, from: 2400, to: 600, gain: .5 });
  },
  clank(scene) {
    const a = output(scene); if (!a) return;
    tone(a.ctx, a.out, { from: 1900, to: 1400, duration: .25, gain: .35, type: 'triangle' });
    tone(a.ctx, a.out, { from: 2650, to: 2100, duration: .2, gain: .2, type: 'triangle' });
  },
  flare(scene) {
    const a = output(scene); if (!a) return;
    noiseBurst(a.ctx, a.out, { duration: .6, from: 400, to: 5200, gain: .55, q: .6 });
    tone(a.ctx, a.out, { from: 220, to: 880, duration: .5, gain: .25, type: 'triangle' });
  },
  hurt(scene) {
    const a = output(scene); if (!a) return;
    tone(a.ctx, a.out, { from: 220, to: 70, duration: .35, gain: .7, type: 'sawtooth' });
    noiseBurst(a.ctx, a.out, { duration: .25, from: 800, to: 200, gain: .45, type: 'lowpass' });
  },
  dodge(scene) {
    const a = output(scene); if (!a) return;
    noiseBurst(a.ctx, a.out, { duration: .22, from: 2600, to: 500, gain: .3, q: .5 });
  },
  enemyDeath(scene) {
    const a = output(scene); if (!a) return;
    noiseBurst(a.ctx, a.out, { duration: .45, from: 1600, to: 120, gain: .45, q: 2 });
  },
  windup(scene) {
    const a = output(scene); if (!a) return;
    tone(a.ctx, a.out, { from: 70, to: 140, duration: .5, gain: .4, type: 'sawtooth' });
  },
  radio(scene, frequency) {
    const a = output(scene); if (!a) return;
    noiseBurst(a.ctx, a.out, { duration: .18, from: 250, to: 1800, gain: .12, q: .5 });
    tone(a.ctx, a.out, { from: [180, 320, 510][frequency], to: [210, 390, 660][frequency],
      duration: .28, gain: .18, type: 'triangle' });
  },
  thunder(scene) {
    const a = output(scene); if (!a) return;
    noiseBurst(a.ctx, a.out, { duration: .9, from: 190, to: 45, gain: .44, type: 'lowpass', q: .4 });
    tone(a.ctx, a.out, { from: 90, to: 34, duration: .75, gain: .25, type: 'sawtooth' });
  },
};
