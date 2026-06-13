/**
 * WEB.OS System Configuration
 * 
 * Global configuration constants and feature flags.
 * All settings must be explicitly defined here—no magic numbers.
 */

import type { SystemConfig } from '../types/index';

// ============================================================================
// SYSTEM LIMITS & CONSTRAINTS
// ============================================================================

export const SYSTEM_LIMITS = {
  /** Maximum number of concurrent processes */
  MAX_PROCESSES: 32,

  /** Maximum memory per process (MB) */
  MAX_PROCESS_MEMORY: 50,

  /** Total system memory quota (MB) */
  TOTAL_MEMORY_QUOTA: 256,

  /** Maximum file size (MB) */
  MAX_FILE_SIZE: 10,

  /** Maximum path depth (prevents too-deep nesting) */
  MAX_PATH_DEPTH: 64,

  /** Maximum filename length (characters) */
  MAX_FILENAME_LENGTH: 255,

  /** Maximum VFS nodes in single directory */
  MAX_DIR_ENTRIES: 1000,

  /** Maximum Socket.io message size (bytes) */
  MAX_MESSAGE_SIZE: 1024 * 1024, // 1MB

  /** Socket.io connection timeout (ms) */
  SOCKET_TIMEOUT: 30000,

  /** Session cache TTL (ms) */
  CACHE_TTL: 3600000, // 1 hour
} as const;

// ============================================================================
// PERFORMANCE SETTINGS
// ============================================================================

export const PERFORMANCE = {
  /** App startup timeout (ms) */
  APP_STARTUP_TIMEOUT: 5000,

  /** File operation timeout (ms) */
  FILE_OP_TIMEOUT: 10000,

  /** Process polling interval (ms) */
  PROCESS_POLL_INTERVAL: 1000,

  /** Memory check interval (ms) */
  MEMORY_CHECK_INTERVAL: 5000,

  /** Max render frame rate (fps) */
  MAX_FPS: 60,

  /** VFS sync to database interval (ms) */
  VFS_SYNC_INTERVAL: 30000,
} as const;

// ============================================================================
// THEME & UI
// ============================================================================

export const UI = {
  /** Font family (must match Monofrik installation) */
  FONT_FAMILY: 'Monofrik, monospace',

  /** Primary background color (cyberpunk black) */
  COLOR_BG: '#000000',

  /** Primary text color (white) */
  COLOR_TEXT: '#FFFFFF',

  /** Accent color (cyberpunk neon green) */
  COLOR_ACCENT: '#00FF00',

  /** Border/line color */
  COLOR_BORDER: '#FFFFFF',

  /** Default window z-index */
  Z_WINDOW_DEFAULT: 100,

  /** Taskbar z-index (always on top) */
  Z_TASKBAR: 1000,

  /** Modal z-index (overlays everything) */
  Z_MODAL: 10000,

  /** Animation duration (ms) for standard transitions */
  ANIMATION_DURATION: 200,

  /** Border radius (px) */
  BORDER_RADIUS: 0, // Sharp edges for cyberpunk aesthetic
} as const;

// ============================================================================
// FILE SYSTEM DEFAULTS
// ============================================================================

export const FS = {
  /** Default file permissions (Unix-style) */
  DEFAULT_PERMISSIONS: '644',

  /** Default directory permissions */
  DEFAULT_DIR_PERMISSIONS: '755',

  /** System user */
  SYSTEM_USER: 'system',

  /** Root directory path */
  ROOT_PATH: '/',

  /** Home directory path */
  HOME_PATH: '/home',

  /** Temp directory path */
  TMP_PATH: '/tmp',

  /** Applications directory */
  APPS_PATH: '/usr/apps',

  /** System binaries directory */
  BIN_PATH: '/usr/bin',
} as const;

// ============================================================================
// DATABASE SETTINGS
// ============================================================================

export const DATABASE = {
  /** Database file name (stored in IndexedDB or local) */
  DB_NAME: 'web-os',

  /** Current schema version */
  SCHEMA_VERSION: 1,

  /** Enable foreign key constraints */
  FOREIGN_KEYS: true,

  /** Enable WAL mode for better concurrency */
  WAL_MODE: true,

  /** Synchronous mode (0 = off, 1 = normal, 2 = full) */
  SYNC_MODE: 1,

  /** Journal mode */
  JOURNAL_MODE: 'wal',
} as const;

// ============================================================================
// SECURITY SETTINGS
// ============================================================================

export const SECURITY = {
  /** Enable sandboxing for apps */
  ENABLE_SANDBOX: true,

  /** Enable Content Security Policy headers */
  ENABLE_CSP: true,

  /** Allowed origins for Socket.io */
  ALLOWED_ORIGINS: ['localhost', 'http://localhost:3000', 'http://localhost:3001'],

  /** Enable CORS */
  ENABLE_CORS: false,

  /** Sensitive operations require confirmation */
  REQUIRE_CONFIRMATION_FOR: [
    'fs:delete_root',
    'proc:kill_system',
    'sys:reboot',
    'sys:factory_reset'
  ],

  /** Rate limit: Socket.io messages per second */
  RATE_LIMIT_MSG_PER_SEC: 100,

  /** Rate limit: File operations per second */
  RATE_LIMIT_FILE_OPS_PER_SEC: 50,
} as const;

// ============================================================================
// LOGGING SETTINGS
// ============================================================================

export const LOGGING = {
  /** Minimum log level to output */
  MIN_LEVEL: (typeof import.meta !== 'undefined' && import.meta.env?.DEV) ? 'debug' : 'info',

  /** Store logs in IndexedDB */
  STORE_IN_DB: true,

  /** Max logs to keep in memory */
  MAX_IN_MEMORY_LOGS: 1000,

  /** Max logs to keep in database */
  MAX_DB_LOGS: 10000,

  /** Log rotation size (MB) */
  LOG_ROTATION_SIZE: 5,
} as const;

// ============================================================================
// DEFAULT SYSTEM CONFIG
// ============================================================================

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  theme: 'dark',
  locale: 'en-US',
  timezone: 'UTC',
  autoSaveInterval: 30000,
  maxProcesses: SYSTEM_LIMITS.MAX_PROCESSES,
  maxMemoryMB: SYSTEM_LIMITS.TOTAL_MEMORY_QUOTA,
  enableSecureMode: true,
  debugMode: (typeof import.meta !== 'undefined' && import.meta.env?.DEV) || false,
};

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURES = {
  /** Enable experimental features */
  ENABLE_EXPERIMENTAL: false,

  /** Enable hot reload in development */
  ENABLE_HOT_RELOAD: (typeof import.meta !== 'undefined' && import.meta.env?.DEV) || false,

  /** Enable performance monitoring */
  ENABLE_PERF_MONITORING: true,

  /** Enable socket.io compression */
  ENABLE_SOCKET_COMPRESSION: true,

  /** Enable VFS persistence to IndexedDB */
  ENABLE_VFS_PERSISTENCE: true,

  /** Enable auto-save for apps */
  ENABLE_AUTO_SAVE: true,
} as const;

// ============================================================================
// VALIDATION: Ensure configuration makes sense
// ============================================================================

if (SYSTEM_LIMITS.MAX_PROCESS_MEMORY * SYSTEM_LIMITS.MAX_PROCESSES > SYSTEM_LIMITS.TOTAL_MEMORY_QUOTA) {
  console.warn(
    'Configuration warning: MAX_PROCESS_MEMORY × MAX_PROCESSES exceeds TOTAL_MEMORY_QUOTA. ' +
    'Processes may fail to spawn under memory pressure.'
  );
}

if (UI.ANIMATION_DURATION < 0 || UI.ANIMATION_DURATION > 5000) {
  throw new Error('ANIMATION_DURATION must be between 0 and 5000ms');
}
