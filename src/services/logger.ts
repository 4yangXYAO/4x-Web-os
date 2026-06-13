/**
 * NA.os Logger Service
 * 
 * Centralized logging system for all modules.
 * Stores logs in memory and IndexedDB for persistence.
 * 
 * Responsibilities:
 * - Log messages with level (debug, info, warn, error, fatal)
 * - Store logs with timestamps and source tracking
 * - Provide log retrieval and filtering
 * - Handle log rotation and cleanup
 */

import type { LogEntry, LogLevel } from '@include/types';
import { LOGGING } from '@include/config';

// ============================================================================
// LOG STORAGE
// ============================================================================

let inMemoryLogs: LogEntry[] = [];
let dbReady = false;

/**
 * Initialize logger and set up IndexedDB storage.
 * 
 * @returns Promise that resolves when logger is ready
 */
export async function initializeLogger(): Promise<void> {
  try {
    // Test IndexedDB availability
    if (!window.indexedDB) {
      console.warn('[Logger] IndexedDB not available. Using in-memory only.');
      return;
    }

    // Open or create database
    const request = window.indexedDB.open('NA.os-logs', 1);

    request.onerror = () => {
      console.error('[Logger] Failed to open IndexedDB');
    };

    request.onsuccess = () => {
      dbReady = true;
      console.log('[Logger] Initialized with IndexedDB persistence');
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('logs')) {
        const store = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('level', 'level', { unique: false });
        store.createIndex('source', 'source', { unique: false });
      }
    };

    // Wait for async initialization
    await new Promise((resolve) => setTimeout(resolve, 100));
  } catch (err) {
    console.error('[Logger] Initialization error:', err);
  }
}

/**
 * Get log level severity (lower = more severe).
 * 
 * @param level Log level
 * @returns Severity value
 */
function getLogSeverity(level: LogLevel): number {
  const severity: Record<LogLevel, number> = {
    debug: 4,
    info: 3,
    warn: 2,
    error: 1,
    fatal: 0
  };
  return severity[level];
}

/**
 * Check if log level should be output based on config.
 * 
 * @param level Log level to check
 * @returns True if should be logged
 */
function shouldLog(level: LogLevel): boolean {
  const minLevel = LOGGING.MIN_LEVEL as LogLevel;
  return getLogSeverity(level) <= getLogSeverity(minLevel);
}

/**
 * Format log entry for console output.
 * 
 * @param entry Log entry
 * @returns Formatted string
 */
function formatLogEntry(entry: LogEntry): string {
  const timestamp = entry.timestamp.toISOString();
  const level = entry.level.toUpperCase().padEnd(5);
  const source = `[${entry.source}]`.padEnd(20);

  return `${timestamp} ${level} ${source} ${entry.message}`;
}

/**
 * Output log to console with appropriate method.
 * 
 * @param entry Log entry
 */
function outputToConsole(entry: LogEntry): void {
  const formatted = formatLogEntry(entry);

  switch (entry.level) {
    case 'debug':
      console.debug(formatted, entry.data);
      break;
    case 'info':
      console.info(formatted, entry.data);
      break;
    case 'warn':
      console.warn(formatted, entry.data);
      break;
    case 'error':
      console.error(formatted, entry.data, entry.stackTrace);
      break;
    case 'fatal':
      console.error('🔴 FATAL ERROR:', formatted, entry.data, entry.stackTrace);
      break;
  }
}

/**
 * Store log entry in IndexedDB.
 * 
 * @param entry Log entry
 */
async function storeInDatabase(entry: LogEntry): Promise<void> {
  if (!dbReady) return;

  try {
    const request = window.indexedDB.open('NA.os-logs', 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['logs'], 'readwrite');
      const store = transaction.objectStore('logs');

      store.add(entry);

      // Cleanup old logs if over limit
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        if (countRequest.result > LOGGING.MAX_DB_LOGS) {
          const getRequest = store.index('timestamp').getAll();
          getRequest.onsuccess = () => {
            const entries = getRequest.result;
            const toDelete = entries.slice(0, entries.length - LOGGING.MAX_DB_LOGS);
            toDelete.forEach((e) => store.delete((e as any).id));
          };
        }
      };
    };
  } catch (err) {
    console.error('[Logger] Database store error:', err);
  }
}

/**
 * Log message at specified level.
 * 
 * @param level Log level
 * @param source Source module name
 * @param message Log message
 * @param data Optional data object
 * @param stackTrace Optional stack trace
 */
export function log(
  level: LogLevel,
  source: string,
  message: string,
  data?: Record<string, unknown>,
  stackTrace?: string
): void {
  // Check if should log based on min level
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date(),
    level,
    source,
    message,
    data,
    stackTrace
  };

  // Add to in-memory storage
  inMemoryLogs.push(entry);
  if (inMemoryLogs.length > LOGGING.MAX_IN_MEMORY_LOGS) {
    inMemoryLogs = inMemoryLogs.slice(-LOGGING.MAX_IN_MEMORY_LOGS);
  }

  // Output to console
  outputToConsole(entry);

  // Store in database
  if (LOGGING.STORE_IN_DB) {
    storeInDatabase(entry).catch(err => {
      console.error('[Logger] Failed to store log:', err);
    });
  }

  // For fatal errors, also send to external monitoring (if configured)
  if (level === 'fatal') {
    reportFatalError(entry);
  }
}

/**
 * Log debug-level message.
 * 
 * @param source Source module
 * @param message Message
 * @param data Optional data
 */
export function debug(source: string, message: string, data?: Record<string, unknown>): void {
  log('debug', source, message, data);
}

/**
 * Log info-level message.
 * 
 * @param source Source module
 * @param message Message
 * @param data Optional data
 */
export function info(source: string, message: string, data?: Record<string, unknown>): void {
  log('info', source, message, data);
}

/**
 * Log warning-level message.
 * 
 * @param source Source module
 * @param message Message
 * @param data Optional data
 */
export function warn(source: string, message: string, data?: Record<string, unknown>): void {
  log('warn', source, message, data);
}

/**
 * Log error-level message.
 * 
 * @param source Source module
 * @param message Message
 * @param error Error object
 */
export function error(source: string, message: string, error?: Error): void {
  log('error', source, message, { errorName: error?.name, errorMessage: error?.message }, error?.stack);
}

/**
 * Log fatal error and trigger error handling.
 * 
 * @param source Source module
 * @param message Message
 * @param error Error object
 */
export function fatal(source: string, message: string, error?: Error): void {
  log('fatal', source, message, { errorName: error?.name, errorMessage: error?.message }, error?.stack);
}

/**
 * Get all in-memory logs.
 * 
 * @returns Array of log entries
 */
export function getLogs(): LogEntry[] {
  return [...inMemoryLogs];
}

/**
 * Get logs filtered by level.
 * 
 * @param level Log level to filter by
 * @returns Filtered logs
 */
export function getLogsByLevel(level: LogLevel): LogEntry[] {
  return inMemoryLogs.filter(log => log.level === level);
}

/**
 * Get logs filtered by source.
 * 
 * @param source Source module name
 * @returns Filtered logs
 */
export function getLogsBySource(source: string): LogEntry[] {
  return inMemoryLogs.filter(log => log.source === source);
}

/**
 * Clear all in-memory logs.
 */
export function clearLogs(): void {
  inMemoryLogs = [];
}

/**
 * Report fatal error (stub for external monitoring integration).
 * 
 * @param entry Log entry of fatal error
 */
async function reportFatalError(entry: LogEntry): Promise<void> {
  // TODO: Integrate with external error tracking (Sentry, etc.)
  // For now, just log to console
  console.error('[Logger] FATAL error reported:', entry);
}

// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================

/**
 * Install global error handler to catch unhandled errors.
 */
export function installGlobalErrorHandler(): void {
  window.addEventListener('error', (event) => {
    error('[Global]', 'Uncaught error', event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    error('[Global]', 'Unhandled promise rejection', event.reason);
  });
}

export default {
  initializeLogger,
  log,
  debug,
  info,
  warn,
  error,
  fatal,
  getLogs,
  getLogsByLevel,
  getLogsBySource,
  clearLogs,
  installGlobalErrorHandler
};
