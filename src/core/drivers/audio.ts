/**
 * WEB.OS Audio Driver
 * 
 * Handles system sounds, notifications, and application audio.
 * Uses the Web Audio API for low-latency playback.
 */

import { info, warn } from '@services/logger';

export class AudioDriver {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    // Audio context is initialized on first user interaction
  }

  private async ensureContext(): Promise<boolean> {
    if (this.context) {
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }
      return true;
    }

    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      info('driver', 'Audio context initialized');
      return true;
    } catch (err) {
      warn('driver', 'Audio context failed to initialize');
      return false;
    }
  }

  /**
   * Play a simple beep sound (useful for terminal/errors).
   */
  public async beep(frequency = 440, duration = 0.1, type: OscillatorType = 'sine'): Promise<void> {
    if (!(await this.ensureContext()) || !this.context || !this.masterGain) return;

    const osc = this.context.createOscillator();
    const env = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.context.currentTime);

    env.gain.setValueAtTime(0, this.context.currentTime);
    env.gain.linearRampToValueAtTime(0.2, this.context.currentTime + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);

    osc.connect(env);
    env.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + duration);
  }

  /**
   * Set master volume level.
   * @param level 0.0 to 1.0
   */
  public setVolume(level: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, level)), 0, 0.1);
    }
  }
}

let instance: AudioDriver | null = null;

export function initializeAudioDriver(): AudioDriver {
  if (!instance) {
    instance = new AudioDriver();
  }
  return instance;
}

export default initializeAudioDriver;
