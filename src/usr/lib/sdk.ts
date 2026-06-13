/**
 * WEB.OS SDK
 * 
 * Public API for User Applications.
 * Provides a secure bridge between apps and the kernel.
 * 
 * Apps should only use this SDK to interact with system resources.
 */

import * as vfs from '@core/fs/vfs';
import * as proc from '@core/proc/proc';
import * as mem from '@core/mem/mem';
import * as eventBus from '@services/event-bus';
import * as logger from '@services/logger';

// ============================================================================
// FILE SYSTEM
// ============================================================================

export const fs = {
  read: vfs.readFileSync,
  write: vfs.writeFileSync,
  mkdir: vfs.mkdirSync,
  ls: vfs.readdirSync,
  rm: vfs.unlinkSync,
  exists: vfs.existsSync,
  stat: vfs.statSync
};

// ============================================================================
// PROCESS MANAGEMENT
// ============================================================================

export const system = {
  spawn: proc.spawn,
  kill: proc.kill,
  ps: proc.listProcesses,
  getInfo: proc.getProcess
};

// ============================================================================
// COMMUNICATION
// ============================================================================

export const events = {
  on: eventBus.on,
  once: eventBus.once,
  emit: eventBus.emit,
  namespace: eventBus.namespace
};

// ============================================================================
// DIAGNOSTICS & MEMORY
// ============================================================================

export const diag = {
  log: logger.info,
  warn: logger.warn,
  error: logger.error,
  getMemStats: mem.getStats,
  getCache: mem.getCache,
  setCache: mem.setCache
};

// ============================================================================
// UI HELPERS (Stubs for now)
// ============================================================================

export const ui = {
  notify: (title: string, message: string) => {
    eventBus.emit('ui:notify', { title, message, timestamp: new Date() });
  },
  alert: (message: string) => {
    eventBus.emit('ui:alert', { message, timestamp: new Date() });
  }
};

/**
 * Main SDK Export
 */
const sdk = {
  fs,
  system,
  events,
  diag,
  ui
};

export default sdk;
