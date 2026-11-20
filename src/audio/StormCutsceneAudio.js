const RAIN_LOOP_SECONDS = 4;

function noiseBuffer(context, seconds, smoothing = 0) {
  const length = Math.ceil(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  let previous = 0;
  for (let index = 0; index < length; index++) {
    const white = Math.random() * 2 - 1;
    previous = white * (1 - smoothing) + previous * smoothing;
    samples[index] = previous;
  }
  return buffer;
}

export class StormCutsceneAudio {
  constructor(scene) {
    this.context = scene.sound?.context ?? null;
    this.sources = [];
    this.master = null;
    this.started = false;
  }

  start() {
    if (this.started || !this.context) return;
    this.started = true;
    const context = this.context;
    if (context.state === 'suspended') context.resume().catch(() => {});

    this.master = context.createGain();
    this.master.gain.setValueAtTime(.46, context.currentTime);
    this.master.connect(context.destination);
    this.startRain();

    // The middle of the film contains the radio message, so the storm recedes
    // there and returns around the final exterior lighthouse shot.
    this.scheduleThunder(2.4, .72);
    this.scheduleThunder(5.8, .48);
    this.scheduleThunder(19.1, .9);
  }

  startRain() {
    const context = this.context;
    const now = context.currentTime;
    const source = context.createBufferSource();
    source.buffer = noiseBuffer(context, RAIN_LOOP_SECONDS, .16);
    source.loop = true;

    const highpass = context.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 650;
    const lowpass = context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 6800;
    const gain = context.createGain();
    gain.gain.setValueAtTime(.105, now);
    gain.gain.setValueAtTime(.105, now + 6.5);
    gain.gain.linearRampToValueAtTime(.038, now + 8.5);
    gain.gain.setValueAtTime(.038, now + 16.8);
    gain.gain.linearRampToValueAtTime(.11, now + 18.8);

    source.connect(highpass).connect(lowpass).connect(gain).connect(this.master);
    source.start(now);
    this.sources.push(source);
  }

  scheduleThunder(delay, intensity) {
    const context = this.context;
    const start = context.currentTime + delay;
    const duration = 4.4;
    const source = context.createBufferSource();
    source.buffer = noiseBuffer(context, duration, .985);

    const lowpass = context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(260, start);
    lowpass.frequency.exponentialRampToValueAtTime(90, start + duration);
    const gain = context.createGain();
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(.42 * intensity, start + .08);
    gain.gain.exponentialRampToValueAtTime(.18 * intensity, start + .55);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);

    source.connect(lowpass).connect(gain).connect(this.master);
    source.start(start);
    source.stop(start + duration);
    this.sources.push(source);

    const crack = context.createBufferSource();
    crack.buffer = noiseBuffer(context, .28, .1);
    const crackFilter = context.createBiquadFilter();
    crackFilter.type = 'highpass';
    crackFilter.frequency.value = 1050;
    const crackGain = context.createGain();
    crackGain.gain.setValueAtTime(.0001, start);
    crackGain.gain.exponentialRampToValueAtTime(.12 * intensity, start + .012);
    crackGain.gain.exponentialRampToValueAtTime(.0001, start + .28);
    crack.connect(crackFilter).connect(crackGain).connect(this.master);
    crack.start(start);
    crack.stop(start + .3);
    this.sources.push(crack);
  }

  stop() {
    if (!this.started) return;
    this.started = false;
    const now = this.context.currentTime;
    if (this.master) {
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(0, now, .08);
    }
    for (const source of this.sources) {
      try { source.stop(now + .35); } catch { /* Source may have ended already. */ }
    }
    this.sources = [];
  }
}
