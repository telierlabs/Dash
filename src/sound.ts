/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngineClass {
  private ctx: AudioContext | null = null;
  private musicInterval: any = null;
  private musicStep = 0;
  private isMusicPlaying = false;
  private isMuted = false;
  private isSfxMuted = false;

  // Happy pentatonic melody for BGM
  private melody = [
    261.63, 293.66, 329.63, 392.00, 440.00, 392.00, 329.63, 293.66,
    329.63, 392.00, 440.00, 523.25, 440.00, 392.00, 329.63, 261.63
  ];

  init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  setMute(musicMuted: boolean, sfxMuted: boolean) {
    this.isMuted = musicMuted;
    this.isSfxMuted = sfxMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else if (this.isMusicPlaying) {
      // Re-trigger background loop if active
      this.startBGM();
    }
  }

  playSFX(type: 'jump' | 'double_jump' | 'slide' | 'coin' | 'hit' | 'unlock' | 'click') {
    this.init();
    if (!this.ctx || this.isSfxMuted) return;

    // Resume context if suspended (browser autoplay security)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;

    switch (type) {
      case 'click': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }
      case 'jump': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case 'double_jump': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.18);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

        osc.start(now);
        osc.stop(now + 0.18);
        break;
      }
      case 'slide': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

        // Lowpass filter for warm sliding sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        
        osc.disconnect(gain);
        osc.connect(filter);
        filter.connect(gain);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
      case 'coin': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        // Classic "ding-ding"
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
      case 'unlock': {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.type = 'triangle';
        osc2.type = 'sine';

        // Play an ascending chord
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          osc1.frequency.setValueAtTime(freq, now + idx * 0.06);
          osc2.frequency.setValueAtTime(freq * 1.5, now + idx * 0.06);
        });

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc1.start(now);
        osc1.stop(now + 0.4);
        osc2.start(now);
        osc2.stop(now + 0.4);
        break;
      }
      case 'hit': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.35);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }
    }
  }

  startBGM() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    this.isMusicPlaying = true;
    if (this.musicInterval) clearInterval(this.musicInterval);

    // Simple looping sequencer
    const tempo = 150; // 150ms per beat
    this.musicInterval = setInterval(() => {
      if (!this.ctx || this.isMuted || this.ctx.state === 'suspended') return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      const freq = this.melody[this.musicStep];
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.02, now); // Very soft background level
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.start(now);
      osc.stop(now + 0.12);

      this.musicStep = (this.musicStep + 1) % this.melody.length;
    }, tempo);
  }

  stopBGM() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const SoundEngine = new SoundEngineClass();
