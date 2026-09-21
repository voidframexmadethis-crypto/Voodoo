// 🎵 REAL-TIME WEB AUDIO SYNTHESIZER FALLBACK ENGINE
// Guarantees zero silence when playing audio beats in browser environment

class WebAudioBeatEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private intervalId: any = null;
  private step = 0;
  private currentBpm = 130;

  public start(bpm: number = 130) {
    this.stop();
    this.currentBpm = bpm > 0 ? bpm : 130;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.isPlaying = true;
      this.step = 0;

      const tempoMs = (60 / this.currentBpm / 4) * 1000; // 16th notes
      this.intervalId = setInterval(() => {
        if (!this.ctx || !this.isPlaying) return;
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        this.playStep(this.step % 16);
        this.step++;
      }, tempoMs);
    } catch (e) {
      console.error('Failed to initialize Web Audio Engine:', e);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private playStep(s: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Kick Drum (0, 8, 10, 14)
    if (s === 0 || s === 8 || s === 10 || s === 14) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.25);
      gain.gain.setValueAtTime(1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }

    // Snare / Clapp (4, 12)
    if (s === 4 || s === 12) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    }

    // Hi-Hat (Every 2 steps, extra open hat on step 14)
    if (s % 2 === 0 || s === 15) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(7000 + (s % 4 === 2 ? 1000 : 0), now);
      const hatDecay = s === 14 ? 0.12 : 0.04;
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + hatDecay);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + hatDecay);
    }

    // 808 Bass Synth (Steps 0, 3, 6, 10, 12)
    if (s === 0 || s === 3 || s === 6 || s === 10 || s === 12) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const freqs = [55, 61.74, 65.41, 49, 55]; // A1, B1, C2, G1, A1
      const freq = freqs[s % freqs.length];
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  }
}

export const globalSynthBeatEngine = new WebAudioBeatEngine();
