// Tiny WebAudio synth for cozy sound effects. No assets, all generated.

export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  tone(freq, dur, type = 'sine', vol = 0.12, slide = 0, delay = 0) {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    const t0 = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const gn = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    gn.gain.setValueAtTime(0, t0);
    gn.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(gn).connect(ctx.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  noise(dur, vol = 0.08, freq = 800, delay = 0) {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    const t0 = ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(vol, t0);
    gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(gn).connect(ctx.destination);
    src.start(t0);
  }

  // named effects
  plant() { this.noise(0.12, 0.1, 500); this.tone(220, 0.1, 'triangle', 0.07, -60); }
  harvest() { this.tone(392, 0.09, 'triangle', 0.1); this.tone(523, 0.12, 'triangle', 0.1, 0, 0.07); }
  coin() { this.tone(880, 0.07, 'square', 0.05); this.tone(1318, 0.14, 'square', 0.05, 0, 0.06); }
  pickup() { this.tone(660, 0.08, 'triangle', 0.09); this.tone(990, 0.1, 'triangle', 0.08, 0, 0.05); }
  swing() { this.noise(0.12, 0.07, 1600); }
  hit() { this.noise(0.08, 0.12, 300); this.tone(140, 0.1, 'sawtooth', 0.06, -40); }
  hurt() { this.tone(196, 0.18, 'sawtooth', 0.1, -60); }
  cluck() { this.tone(740, 0.05, 'square', 0.06, 120); this.tone(620, 0.07, 'square', 0.05, -80, 0.07); }
  splash() { this.noise(0.25, 0.09, 700); }
  bite() { this.tone(987, 0.06, 'square', 0.09); this.tone(987, 0.06, 'square', 0.09, 0, 0.09); }
  talk() { this.tone(520, 0.05, 'triangle', 0.05); }
  door() { this.noise(0.18, 0.06, 240); }
  seal() { this.tone(208, 0.3, 'sine', 0.1, 80); this.tone(312, 0.3, 'sine', 0.08, 80, 0.1); }
  bossDown() {
    [262, 330, 392, 523].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.1, 0, i * 0.11));
  }
  relic() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.3, 'sine', 0.09, 0, i * 0.09));
  }
  raid() { this.tone(180, 0.25, 'sawtooth', 0.08, -50); this.tone(170, 0.25, 'sawtooth', 0.08, -50, 0.2); }
  sleep() { [392, 330, 262].forEach((f, i) => this.tone(f, 0.3, 'sine', 0.08, 0, i * 0.15)); }
  win() {
    [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.1, 0, i * 0.13));
  }
}
