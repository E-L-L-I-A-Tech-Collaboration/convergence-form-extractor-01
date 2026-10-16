// Web Audio API Generative Meditative Soundscape Engine
// Completely client-side, zero external network dependencies, works offline and in Android TWA / PWA.

export type MeditativeTrack = 'celestial-432' | 'solfeggio-528' | 'theta-drone' | 'tibetan-bowl';

export interface SoundscapeTrackInfo {
  id: MeditativeTrack;
  name: string;
  frequencyHz: number;
  description: string;
  themeColor: string;
}

export const SOUNDSCAPE_TRACKS: SoundscapeTrackInfo[] = [
  {
    id: 'celestial-432',
    name: '432 Hz Celestial Serenity',
    frequencyHz: 432,
    description: 'Natural harmonic tuning with warm ambient major pentatonic pads and gentle shimmer.',
    themeColor: '#f59e0b'
  },
  {
    id: 'solfeggio-528',
    name: '528 Hz Solfeggio Miracles',
    frequencyHz: 528,
    description: 'Vagal relaxation & cellular resonance frequency with deep warm filter sweeps.',
    themeColor: '#10b981'
  },
  {
    id: 'theta-drone',
    name: '6 Hz Theta Wave Coherence',
    frequencyHz: 136.1,
    description: 'Binaural theta pulsation (6 Hz carrier difference) for deep autonomic focus.',
    themeColor: '#8b5cf6'
  },
  {
    id: 'tibetan-bowl',
    name: 'Singing Bowl & Cosmic Om',
    frequencyHz: 136.1,
    description: 'Earth-year fundamental resonance with rich harmonic overtone chanting bells.',
    themeColor: '#0ea5e9'
  }
];

class MeditationMusicEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private masterGain: GainNode | null = null;
  private currentTrack: MeditativeTrack = 'celestial-432';
  private volume = 0.6; // 0.0 to 1.0
  private activeNodes: { stop: () => void }[] = [];
  private intervalTimer: number | null = null;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public isMusicActive(): boolean {
    return this.isPlaying;
  }

  public getCurrentTrack(): MeditativeTrack {
    return this.currentTrack;
  }

  public setTrack(track: MeditativeTrack) {
    this.currentTrack = track;
    if (this.isPlaying) {
      this.stop();
      this.start(track);
    }
  }

  public start(track: MeditativeTrack = this.currentTrack) {
    this.currentTrack = track;
    const ctx = this.getContext();

    if (this.isPlaying) {
      this.stop();
    }

    this.isPlaying = true;

    // Master Gain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    this.masterGain.gain.exponentialRampToValueAtTime(Math.max(0.01, this.volume), ctx.currentTime + 2.5);
    this.masterGain.connect(ctx.destination);

    // Warm Low-pass Filter for soothing analog character
    const masterFilter = ctx.createBiquadFilter();
    masterFilter.type = 'lowpass';
    masterFilter.frequency.setValueAtTime(680, ctx.currentTime);
    masterFilter.Q.setValueAtTime(1.2, ctx.currentTime);
    masterFilter.connect(this.masterGain);

    const trackMeta = SOUNDSCAPE_TRACKS.find(t => t.id === track) || SOUNDSCAPE_TRACKS[0];
    const baseFreq = trackMeta.frequencyHz;

    // 1. Root Drone Chord Oscillators
    const chordPitches = track === 'solfeggio-528'
      ? [528 / 4, 528 / 3, 528 / 2, 528 * 0.75]
      : track === 'theta-drone'
      ? [136.1, 136.1 * 1.5, 136.1 * 0.5, 136.1 * 2]
      : track === 'tibetan-bowl'
      ? [136.1, 136.1 * 2.76, 136.1 * 4.12, 136.1 * 5.4]
      : [baseFreq / 4, (baseFreq / 4) * 1.25, (baseFreq / 4) * 1.5, (baseFreq / 4) * 1.875]; // 432 Pentatonic

    chordPitches.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Subtle detune for lush spatial chorus
      const detuneCents = (idx - 1.5) * 6;
      osc.detune.setValueAtTime(detuneCents, ctx.currentTime);

      gain.gain.setValueAtTime(0.08 / (idx + 1), ctx.currentTime);

      // Subtle LFO for breathing amplitude swell
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.08 + idx * 0.03, ctx.currentTime); // ~12 second slow breath cycle
      lfoGain.gain.setValueAtTime(0.03, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();

      osc.connect(gain);
      gain.connect(masterFilter);
      osc.start();

      this.activeNodes.push({
        stop: () => {
          try {
            osc.stop();
            lfo.stop();
            osc.disconnect();
            gain.disconnect();
          } catch {
            // safely ignore
          }
        }
      });
    });

    // 2. Binaural Theta Beats for deep focus (if theta-drone or celestial)
    if (track === 'theta-drone' || track === 'celestial-432') {
      const merger = ctx.createChannelMerger(2);
      const leftOsc = ctx.createOscillator();
      const rightOsc = ctx.createOscillator();
      const leftGain = ctx.createGain();
      const rightGain = ctx.createGain();

      const carrier = track === 'theta-drone' ? 108 : 216;
      const beatFreq = 5.5; // 5.5 Hz Theta wave for deep meditation

      leftOsc.frequency.setValueAtTime(carrier, ctx.currentTime);
      rightOsc.frequency.setValueAtTime(carrier + beatFreq, ctx.currentTime);

      leftGain.gain.setValueAtTime(0.04, ctx.currentTime);
      rightGain.gain.setValueAtTime(0.04, ctx.currentTime);

      leftOsc.connect(leftGain);
      rightOsc.connect(rightGain);

      leftGain.connect(merger, 0, 0); // Left ear
      rightGain.connect(merger, 0, 1); // Right ear

      merger.connect(this.masterGain);

      leftOsc.start();
      rightOsc.start();

      this.activeNodes.push({
        stop: () => {
          try {
            leftOsc.stop();
            rightOsc.stop();
            leftOsc.disconnect();
            rightOsc.disconnect();
          } catch {
            // safely ignore
          }
        }
      });
    }

    // 3. Gentle Periodic Harmonic Tibetan Bowl Chime (every ~9-14s)
    const playHarmonicChime = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      const chimeCtx = this.ctx;
      const chimeFreq = track === 'tibetan-bowl' ? 432 : baseFreq * (Math.random() > 0.5 ? 1.5 : 2);

      const chimeOsc = chimeCtx.createOscillator();
      const chimeGain = chimeCtx.createGain();

      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(chimeFreq, chimeCtx.currentTime);

      chimeGain.gain.setValueAtTime(0.001, chimeCtx.currentTime);
      chimeGain.gain.linearRampToValueAtTime(0.07, chimeCtx.currentTime + 0.1);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, chimeCtx.currentTime + 6.0);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.masterGain);

      chimeOsc.start();
      chimeOsc.stop(chimeCtx.currentTime + 6.2);
    };

    // Play once at start, then periodically
    setTimeout(playHarmonicChime, 1500);
    this.intervalTimer = window.setInterval(playHarmonicChime, 11000);
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.4);
      } catch {
        // safely ignore
      }
    }
    setTimeout(() => {
      this.activeNodes.forEach(node => node.stop());
      this.activeNodes = [];
    }, 500);
  }
}

// Global Singleton Instance
export const meditationMusic = new MeditationMusicEngine();

// Speech Synthesis & Formant Voice Chanting Engine for OM and OA-ZA-NA-EIO
export interface ChantVoiceOptions {
  enabled: boolean;
  rate: number;   // 0.6 to 1.0 (slower rate sounds more meditative)
  pitch: number;  // 0.5 to 1.2
  volume: number; // 0.0 to 1.0
  voiceGender?: 'female' | 'male' | 'ambient';
}

export const DEFAULT_CHANT_VOICE: ChantVoiceOptions = {
  enabled: true,
  rate: 0.75,
  pitch: 0.82,
  volume: 0.95
};

export class SpokenMantraEngine {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static cachedVoices: SpeechSynthesisVoice[] = [];

  private static getBestVoice(): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    if (this.cachedVoices.length === 0) {
      this.cachedVoices = this.synth.getVoices();
    }
    // Prefer soothing English voices
    const preferred = this.cachedVoices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    );
    return preferred || this.cachedVoices.find(v => v.lang.startsWith('en')) || this.cachedVoices[0] || null;
  }

  // Speak a timed chant syllable with audio harmonic backing
  public static speakChant(
    syllable: 'OM' | 'OA' | 'ZA' | 'NA' | 'EIO' | string,
    options: Partial<ChantVoiceOptions> = {}
  ) {
    const opts = { ...DEFAULT_CHANT_VOICE, ...options };
    if (!opts.enabled) return;

    // Also trigger subtle resonant overtone in Web Audio API to give physical weight to the vocalization
    this.playVocalResonanceTone(syllable);

    if (!this.synth || typeof SpeechSynthesisUtterance === 'undefined') {
      return;
    }

    try {
      // Cancel previous lingering speech
      this.synth.cancel();

      // Format syllable for spoken warmth and phonetic clarity
      let spokenText = syllable;
      if (syllable === 'OM') {
        spokenText = 'Ommmmm...';
      } else if (syllable === 'OA') {
        spokenText = 'Oh - Ah';
      } else if (syllable === 'ZA') {
        spokenText = 'Zah';
      } else if (syllable === 'NA') {
        spokenText = 'Nah';
      } else if (syllable === 'EIO') {
        spokenText = 'Eh - Ee - Oh';
      }

      const utterance = new SpeechSynthesisUtterance(spokenText);
      const voice = this.getBestVoice();
      if (voice) {
        utterance.voice = voice;
      }
      utterance.rate = opts.rate;
      utterance.pitch = syllable === 'OM' ? 0.72 : opts.pitch;
      utterance.volume = opts.volume;

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis chant notice:', e);
    }
  }

  // Generates a harmonic vowel formant resonance drone using Web Audio API
  private static playVocalResonanceTone(syllable: string) {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const oscSub = ctx.createOscillator();
      const gain = ctx.createGain();

      // Cosmic Om base frequency 136.1 Hz
      let base = 136.1;
      if (syllable === 'OA') base = 162.0;
      if (syllable === 'ZA') base = 216.0;
      if (syllable === 'NA') base = 144.0;
      if (syllable === 'EIO') base = 192.0;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(base, ctx.currentTime);

      oscSub.type = 'triangle';
      oscSub.frequency.setValueAtTime(base * 0.5, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (syllable === 'OM' ? 4.5 : 2.5));

      osc.connect(gain);
      oscSub.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      oscSub.start();
      osc.stop(ctx.currentTime + (syllable === 'OM' ? 4.6 : 2.6));
      oscSub.stop(ctx.currentTime + (syllable === 'OM' ? 4.6 : 2.6));
    } catch {
      // audio context fallback
    }
  }
}
