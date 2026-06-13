/**
 * WEB.OS TTY Driver
 * 
 * Virtual Teletype (TTY) interface for the terminal.
 * Connects the Terminal app with system streams.
 */

import { emit } from '@services/event-bus';
import { info } from '@services/logger';

export class TTY {
  private buffer = '';
  private history: string[] = [];

  constructor(private id: string) {
    info('dev', `TTY device ${id} initialized`);
  }

  /**
   * Write data to the TTY.
   */
  public write(data: string): void {
    this.buffer += data;
    emit(`tty:data:${this.id}`, data);
  }

  /**
   * Read data from input stream.
   */
  public read(data: string): void {
    // Process input
    if (data === '\r' || data === '\n') {
      this.history.push(this.buffer);
      emit(`tty:line:${this.id}`, this.buffer);
      this.buffer = '';
    } else {
      this.buffer += data;
    }
  }

  public getBuffer(): string {
    return this.buffer;
  }
}

const ttys = new Map<string, TTY>();

export function getTTY(id = 'tty0'): TTY {
  if (!ttys.has(id)) {
    ttys.set(id, new TTY(id));
  }
  return ttys.get(id)!;
}

export default getTTY;
