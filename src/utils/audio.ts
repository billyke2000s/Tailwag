import { useSyncExternalStore } from 'react';
import { readStored, isBoolean } from './storage';
/**
 * Web Audio API synthesizer for playful canine sound effects
 * Zero external asset dependencies, works instantly in browser
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled = readStored('sound', true, isBoolean);
  private listeners = new Set<() => void>();
  private master: GainNode | null = null;
  public subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  public snapshot = () => this.soundEnabled;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.soundEnabled ? 1 : 0;
        this.master.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (this.ctx && this.master) this.master.gain.setValueAtTime(enabled ? 1 : 0, this.ctx.currentTime);
    try { localStorage.setItem('tailwag:v1:sound', JSON.stringify({version:1,value:enabled})); } catch { /* memory-only preference */ }
    this.listeners.forEach(listener => listener());
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Playful synthesized dog bark / "woof" sound
   */
  public playBark() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Two quick pitched bursts for a natural "woof-woof" or single cheerful "bark"
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, now);
      filter.Q.setValueAtTime(2.5, now);

      osc.type = 'sawtooth';
      // Pitch drop creates the canine formant
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.master!);

      osc.start(now);
      osc.stop(now + 0.18);

      // Subtle second echo bark
      setTimeout(() => {
        if (!this.ctx || !this.soundEnabled) return;
        const now2 = this.ctx.currentTime;
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        const filter2 = this.ctx.createBiquadFilter();

        filter2.type = 'bandpass';
        filter2.frequency.setValueAtTime(480, now2);
        filter2.Q.setValueAtTime(2.5, now2);

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(350, now2);
        osc2.frequency.exponentialRampToValueAtTime(160, now2 + 0.1);

        gain2.gain.setValueAtTime(0.001, now2);
        gain2.gain.linearRampToValueAtTime(0.3, now2 + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.14);

        osc2.connect(filter2);
        filter2.connect(gain2);
        gain2.connect(this.master!);

        osc2.start(now2);
        osc2.stop(now2 + 0.15);
      }, 140);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Cheerful high-pitch match celebration chime
   */
  public playMatchCelebration() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteStart = now + idx * 0.09;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(0.25, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.35);

        osc.connect(gain);
        gain.connect(this.master!);

        osc.start(noteStart);
        osc.stop(noteStart + 0.36);
      });
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Card swipe sound
   */
  public playSwipe() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.master!);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Gentle pop or button click
   */
  public playPop() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.master!);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Playful feline meow sound synthesis
   */
  public playMeow() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, now);
      filter.Q.setValueAtTime(2.0, now);

      osc.type = 'triangle';
      // Meow upward inflection then gentle drop
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.32);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.master!);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Gentle rhythmic cat purr
   */
  public playPurr() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(75, now);

      // Low frequency rumble
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.master!);

      osc.start(now);
      osc.stop(now + 0.42);
    } catch {
      // Audio fallback
    }
  }
}

export const soundManager = new SoundManager();

export function useSoundEnabled() { return useSyncExternalStore(soundManager.subscribe, soundManager.snapshot, () => true); }
