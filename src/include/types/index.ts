/**
 * WEB.OS Global Type Definitions
 * 
 * All core types, interfaces, and contracts defined here.
 * Single source of truth for system-wide type safety.
 */

// ============================================================================
// BIOS & HARDWARE
// ============================================================================

export interface HardwareInfo {
  userAgent: string;
  platform: 'windows' | 'mac' | 'linux' | 'unknown';
  hasLocalStorage: boolean;
  hasIndexedDB: boolean;
  hasWebGL: boolean;
  hasWebWorkers: boolean;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
}

// ============================================================================
// VIRTUAL FILE SYSTEM
// ============================================================================

export type FileType = 'file' | 'directory' | 'symlink';

export interface VFSNode {
  id: string;
  name: string;
  type: FileType;
  path: string;
  parentId?: string;
  content?: string | Uint8Array; // For files
  metadata: FileMetadata;
  children?: VFSNode[]; // For directories
}

export interface FileMetadata {
  sizeBytes: number;
  createdAt: Date;
  modifiedAt: Date;
  owner: string;
  permissions: string; // Unix-style: rwxrwxrwx
  mimeType?: string;
  checksum?: string; // For integrity
}

export interface FSOperationResult {
  success: boolean;
  path: string;
  message?: string;
  error?: FSError;
}

export class FSError extends Error {
  constructor(
    public code: 'NOT_FOUND' | 'PERMISSION_DENIED' | 'INVALID_PATH' | 'ALREADY_EXISTS' | 'INVALID_OPERATION',
    message: string
  ) {
    super(message);
    this.name = 'FSError';
  }
}

// ============================================================================
// PROCESS MANAGEMENT
// ============================================================================

export type ProcessState = 'pending' | 'running' | 'paused' | 'terminated' | 'zombie';

export interface ProcessInfo {
  pid: string;
  name: string;
  state: ProcessState;
  appId: string;
  parentPid?: string;
  memoryUsageMB: number;
  createdAt: Date;
  metadata: ProcessMetadata;
}

export interface ProcessMetadata {
  priority: number; // 0-255, lower = higher priority
  cpuPercentage: number;
  uptime: number; // milliseconds
  exitCode?: number;
}

export type ProcessExitCode = number; // 0 = success, non-zero = error

export interface ProcError extends Error {
  code: 'SPAWN_FAILED' | 'NOT_FOUND' | 'KILL_DENIED';
  pid?: string;
}

// ============================================================================
// MEMORY MANAGEMENT
// ============================================================================

export interface MemoryStats {
  totalMB: number;
  usedMB: number;
  freeMB: number;
  cacheHitRate: number; // 0-1
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt: Date;
  createdAt: Date;
}

// ============================================================================
// EVENT BUS (Inter-component Communication)
// ============================================================================

export type EventType = string;
export type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

export interface EventPayload {
  type: EventType;
  timestamp: Date;
  source?: string;
  data?: unknown;
}

export interface EventBusError extends Error {
  code: 'HANDLER_ERROR' | 'INVALID_TYPE';
}

// ============================================================================
// APPLICATIONS
// ============================================================================

export type AppWindowState = 'minimized' | 'normal' | 'maximized' | 'closed';

export interface AppInstance {
  appId: string;
  pid: string;
  title: string;
  windowState: AppWindowState;
  bounds: WindowBounds;
  focusedAt: Date;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AppManifest {
  id: string;
  name: string;
  version: string;
  icon: string;
  category: 'system' | 'utility' | 'game' | 'productivity';
  entry: string; // Path to app entry component
  permissions: AppPermission[];
  maxInstances?: number;
}

export type AppPermission = 
  | 'fs:read'
  | 'fs:write'
  | 'net:socket'
  | 'proc:spawn'
  | 'mem:shared'
  | 'audio:play'
  | 'clipboard:read'
  | 'clipboard:write';

// ============================================================================
// SOCKET.IO (Real-time Communication)
// ============================================================================

export interface SocketMessage {
  id: string;
  type: 'command' | 'response' | 'event' | 'error';
  source: string; // app id or system
  destination: string; // app id or 'system'
  payload: unknown;
  timestamp: Date;
}

export type SocketError = {
  code: 'AUTH_FAILED' | 'MESSAGE_INVALID' | 'TIMEOUT' | 'CONNECTION_LOST';
  message: string;
};

// ============================================================================
// LOGGING & DIAGNOSTICS
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  source: string; // module/component name
  message: string;
  data?: Record<string, unknown>;
  stackTrace?: string;
}

// ============================================================================
// SYSTEM CONFIGURATION
// ============================================================================

export interface SystemConfig {
  theme: 'dark' | 'light';
  locale: string;
  timezone: string;
  autoSaveInterval: number; // milliseconds
  maxProcesses: number;
  maxMemoryMB: number;
  enableSecureMode: boolean;
  debugMode: boolean;
}

// ============================================================================
// COMMON UTILITIES
// ============================================================================

export type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;
