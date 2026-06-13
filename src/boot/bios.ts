/**
 * NA.os BIOS
 * 
 * Hardware detection, browser capability checks, and environment initialization.
 * Runs before bootstrap to ensure system can operate.
 * 
 * Responsibilities:
 * - Detect browser capabilities (localStorage, IndexedDB, WebGL, etc.)
 * - Determine platform (Windows, macOS, Linux)
 * - Validate system requirements
 * - Set up hardware abstraction layer
 */

import type { HardwareInfo } from '@include/types';
import { SYSTEM_LIMITS, LOGGING } from '@include/config';

// ============================================================================
// HARDWARE DETECTION
// ============================================================================

/**
 * Detect and report hardware/browser capabilities.
 * 
 * @returns Hardware information object
 * @throws Error if critical requirements not met
 */
export function detectHardware(): HardwareInfo {
  const info: HardwareInfo = {
    userAgent: navigator.userAgent,
    platform: detectPlatform(),
    hasLocalStorage: checkLocalStorage(),
    hasIndexedDB: checkIndexedDB(),
    hasWebGL: checkWebGL(),
    hasWebWorkers: checkWebWorkers(),
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
  };

  // Validate critical requirements
  validateRequirements(info);

  return info;
}

/**
 * Detect platform from user agent string.
 * 
 * @returns Platform type
 */
function detectPlatform(): HardwareInfo['platform'] {
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('win')) return 'windows';
  if (ua.includes('mac')) return 'mac';
  if (ua.includes('linux') || ua.includes('x11')) return 'linux';

  return 'unknown';
}

/**
 * Check if localStorage is available and functional.
 * 
 * @returns True if localStorage is available
 */
function checkLocalStorage(): boolean {
  try {
    const testKey = '__WEBOS_TEST__';
    localStorage.setItem(testKey, 'test');
    const result = localStorage.getItem(testKey) === 'test';
    localStorage.removeItem(testKey);
    return result;
  } catch {
    return false;
  }
}

/**
 * Check if IndexedDB is available and functional.
 * 
 * @returns True if IndexedDB is available
 */
function checkIndexedDB(): boolean {
  try {
    return !!window.indexedDB;
  } catch {
    return false;
  }
}

/**
 * Check if WebGL is available (for graphics-heavy features).
 * 
 * @returns True if WebGL context can be created
 */
function checkWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
    return !!gl;
  } catch {
    return false;
  }
}

/**
 * Check if Web Workers are available (for background tasks).
 * 
 * @returns True if Web Workers are supported
 */
function checkWebWorkers(): boolean {
  try {
    return typeof Worker !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Validate critical system requirements.
 * 
 * @param info Hardware info object
 * @throws Error if critical features missing
 */
function validateRequirements(info: HardwareInfo): void {
  const errors: string[] = [];

  // Critical requirement: localStorage
  if (!info.hasLocalStorage) {
    errors.push('LocalStorage is required but not available');
  }

  // Critical requirement: IndexedDB (for database)
  if (!info.hasIndexedDB) {
    errors.push('IndexedDB is required but not available. Enable private browsing or check browser settings.');
  }

  // Warning: WebGL (performance enhancement, not critical)
  if (!info.hasWebGL) {
    logWarning('WebGL not available. Some visual effects disabled.');
  }

  // Warning: Web Workers (performance enhancement, not critical)
  if (!info.hasWebWorkers) {
    logWarning('Web Workers not available. Background tasks will run on main thread.');
  }

  // Screen size validation
  if (info.screenWidth < 320 || info.screenHeight < 240) {
    errors.push(`Screen size ${info.screenWidth}x${info.screenHeight} below minimum 320x240`);
  }

  // Throw if critical errors found
  if (errors.length > 0) {
    const message = `System Requirements Not Met:\n${errors.join('\n')}`;
    throw new Error(message);
  }
}

/**
 * Log warning message to console and storage.
 * 
 * @param message Warning message
 */
function logWarning(message: string): void {
  console.warn(`[BIOS] ${message}`);

  // Store warning in localStorage for diagnostics
  try {
    const warnings = JSON.parse(localStorage.getItem('__WEBOS_WARNINGS__') || '[]');
    warnings.push({
      timestamp: new Date().toISOString(),
      message
    });
    localStorage.setItem('__WEBOS_WARNINGS__', JSON.stringify(warnings.slice(-100))); // Keep last 100
  } catch {
    // Silently fail if localStorage write fails
  }
}

// ============================================================================
// MEMORY & PERFORMANCE CONSTRAINTS
// ============================================================================

/**
 * Calculate available memory quota for system.
 * 
 * @returns Memory quota in MB
 */
export function getMemoryQuota(): number {
  // Browser-based systems have limited memory
  // Use device memory API if available, otherwise default
  const deviceMemory = (navigator as any).deviceMemory;

  if (deviceMemory && deviceMemory >= 8) {
    return 256; // 4GB+ devices: full quota
  } else if (deviceMemory && deviceMemory >= 4) {
    return 192; // 2-4GB devices: reduced quota
  } else if (deviceMemory && deviceMemory >= 2) {
    return 128; // 1-2GB devices: limited quota
  }

  // Fallback: conservative estimate based on screen size
  const pixelCount = window.innerWidth * window.innerHeight;
  if (pixelCount > 1280 * 1024) {
    return 128; // Desktop assumed: 1280p+
  }

  return 64; // Mobile: very limited
}

// ============================================================================
// DEVICE DRIVERS ABSTRACTION
// ============================================================================

/**
 * Abstraction for hardware input devices.
 * Provides unified interface for mouse, keyboard, touch input.
 */
export class InputDriver {
  private listeners: Map<string, Set<(e: Event) => void>> = new Map();

  constructor() {
    this.attachListeners();
  }

  /**
   * Register event listener for input event.
   * 
   * @param event Event name ('mousedown', 'keypress', 'touchstart', etc.)
   * @param handler Event handler callback
   */
  on(event: string, handler: (e: Event) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  /**
   * Unregister event listener.
   * 
   * @param event Event name
   * @param handler Event handler to remove
   */
  off(event: string, handler: (e: Event) => void): void {
    this.listeners.get(event)?.delete(handler);
  }

  /**
   * Attach browser event listeners to DOM.
   */
  private attachListeners(): void {
    const events = ['mousedown', 'mouseup', 'mousemove', 'keydown', 'keyup', 'touchstart', 'touchend'];

    events.forEach(event => {
      document.addEventListener(event, (e: Event) => {
        this.listeners.get(event)?.forEach(handler => {
          try {
            handler(e);
          } catch (err) {
            console.error(`[InputDriver] Handler error for ${event}:`, err);
          }
        });
      });
    });
  }
}

/**
 * Abstraction for storage operations (localStorage + IndexedDB).
 */
export class StorageDriver {
  /**
   * Read value from localStorage (for small data).
   * 
   * @param key Storage key
   * @returns Stored value or null
   */
  readLocal(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      console.error(`[StorageDriver] Read error:`, err);
      return null;
    }
  }

  /**
   * Write value to localStorage.
   * 
   * @param key Storage key
   * @param value Value to store
   * @returns True if successful
   */
  writeLocal(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (err) {
      console.error(`[StorageDriver] Write error:`, err);
      return false;
    }
  }

  /**
   * Delete value from localStorage.
   * 
   * @param key Storage key
   * @returns True if successful
   */
  deleteLocal(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error(`[StorageDriver] Delete error:`, err);
      return false;
    }
  }

  /**
   * Clear all localStorage data.
   * 
   * @returns True if successful
   */
  clearLocal(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (err) {
      console.error(`[StorageDriver] Clear error:`, err);
      return false;
    }
  }
}

// ============================================================================
// BIOS INITIALIZATION REPORT
// ============================================================================

export interface BIOSReport {
  hardware: HardwareInfo;
  memoryQuota: number;
  timestamp: Date;
  warnings: string[];
}

/**
 * Run full BIOS diagnostics and return report.
 * 
 * @returns BIOS report with all diagnostics
 */
export function runBIOSDiagnostics(): BIOSReport {
  const warnings: string[] = [];

  try {
    const hardware = detectHardware();
    const memoryQuota = getMemoryQuota();

    // Additional warnings
    if (memoryQuota < SYSTEM_LIMITS.TOTAL_MEMORY_QUOTA) {
      warnings.push(`Memory quota reduced to ${memoryQuota}MB (device memory limited)`);
    }

    if (hardware.devicePixelRatio > 2) {
      warnings.push('High DPI screen detected. Performance may be impacted.');
    }

    return {
      hardware,
      memoryQuota,
      timestamp: new Date(),
      warnings
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`BIOS Diagnostics Failed: ${message}`);
  }
}

export default {
  detectHardware,
  getMemoryQuota,
  InputDriver,
  StorageDriver,
  runBIOSDiagnostics
};
