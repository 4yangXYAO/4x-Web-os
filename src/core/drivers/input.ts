/**
 * NA.os Input Driver
 * 
 * Abstraction layer for handling user input from various devices.
 * Normalizes mouse, keyboard, and touch events for the system.
 */

import { emit } from '@services/event-bus';
import { info } from '@services/logger';

export class InputDriver {
  private active = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e) => this.handleKey(e));
    window.addEventListener('mousedown', (e) => this.handleMouse(e));
    window.addEventListener('mousemove', (e) => this.handleMouse(e));
    window.addEventListener('mouseup', (e) => this.handleMouse(e));
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    this.active = true;
    info('driver', 'Input driver initialized');
  }

  private handleKey(e: KeyboardEvent) {
    emit('dev:input:key', {
      key: e.key,
      code: e.code,
      ctrl: e.ctrlKey,
      shift: e.shiftKey,
      alt: e.altKey,
      meta: e.metaKey,
      type: e.type
    });
  }

  private handleMouse(e: MouseEvent) {
    emit('dev:input:mouse', {
      x: e.clientX,
      y: e.clientY,
      button: e.button,
      type: e.type,
      target: (e.target as HTMLElement)?.id
    });
  }

  public isReady() {
    return this.active;
  }
}

let instance: InputDriver | null = null;

export function initializeInputDriver(): InputDriver {
  if (!instance) {
    instance = new InputDriver();
  }
  return instance;
}

export default initializeInputDriver;
