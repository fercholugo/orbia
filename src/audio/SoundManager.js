export default class SoundManager {
  constructor() {
    this._ctx = null;
    this._muted = localStorage.getItem('orbia_muted') === 'true';
    this._lastWallSound = 0;
  }

  get ctx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this._ctx;
  }

  get muted() { return this._muted; }

  toggleMute() {
    this._muted = !this._muted;
    localStorage.setItem('orbia_muted', this._muted);
    return this._muted;
  }

  // ─── Primitivo: reproduce una nota ───────────────────────────────────────
  _note(freq, type, startTime, duration, gainStart, gainEnd, delay = 0) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime + delay);

    gain.gain.setValueAtTime(gainStart, startTime + delay);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(gainEnd, 0.0001),
      startTime + delay + duration
    );

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime + delay);
    osc.stop(startTime + delay + duration + 0.05);
  }

  // ─── Sonidos ──────────────────────────────────────────────────────────────

  rebotePared() {
    if (this._muted) return;
    const now = Date.now();
    if (now - this._lastWallSound < 100) return; // throttle 100ms
    this._lastWallSound = now;
    const t = this.ctx.currentTime;
    this._note(120, 'sine', t, 0.08, 0.15, 0.001);
  }

  matchSimple() {
    if (this._muted) return;
    const t = this.ctx.currentTime;
    // C4 → E4
    this._note(261.63, 'triangle', t,       0.1,  0.3, 0.001);
    this._note(329.63, 'triangle', t + 0.08, 0.1, 0.3, 0.001);
  }

  matchPerfecto() {
    if (this._muted) return;
    const t = this.ctx.currentTime;
    // C5 + E5 + G5 con decay
    this._note(523.25, 'sine', t, 0.4, 0.35, 0.001);
    this._note(659.25, 'sine', t, 0.4, 0.28, 0.001);
    this._note(783.99, 'sine', t, 0.4, 0.22, 0.001);
    // Brillo extra
    this._note(1046.5, 'sine', t, 0.2, 0.12, 0.001);
  }

  nivelCompletado() {
    if (this._muted) return;
    const t = this.ctx.currentTime;
    // Fanfarria de 5 notas ascendentes
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
    notes.forEach((freq, i) => {
      this._note(freq, 'sine', t + i * 0.13, 0.18, 0.4, 0.001);
    });
  }

  aparicionEsfera() {
    if (this._muted) return;
    const t = this.ctx.currentTime;
    this._note(440, 'triangle', t, 0.1, 0.12, 0.001);
  }
}
