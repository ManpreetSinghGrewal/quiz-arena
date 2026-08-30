// Web Audio API Synthesizer Sound Manager
class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.enabled = localStorage.getItem("soundEnabled") !== "false";
  }

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  toggle(forceState) {
    this.enabled = forceState !== undefined ? forceState : !this.enabled;
    localStorage.setItem("soundEnabled", String(this.enabled));
    return this.enabled;
  }

  playTone(freq, type, duration, volume = 0.1) {
    if (!this.enabled) return;
    try {
      this.init();
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Sound play failed", e);
    }
  }

  playCorrect() {
    // A pleasant high dual-tone
    this.playTone(523.25, "sine", 0.15, 0.1); // C5
    setTimeout(() => {
      this.playTone(659.25, "sine", 0.3, 0.1); // E5
    }, 80);
  }

  playIncorrect() {
    // A low buzzer sound
    this.playTone(150, "sawtooth", 0.4, 0.15);
  }

  playTick() {
    // Soft wooden click
    this.playTone(800, "triangle", 0.05, 0.05);
  }

  playSuccess() {
    // Celebratory arpeggio
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, "sine", 0.4, 0.1);
      }, idx * 120);
    });
  }
}

export const soundManager = new SoundManager();
