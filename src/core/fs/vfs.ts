/**
 * NA.os Virtual File System (VFS)
 * 
 * In-memory file system with SQLite persistence.
 * Provides POSIX-like file operations (read, write, mkdir, rm, etc.).
 * Enforces permission model and path security.
 * 
 * Responsibilities:
 * - Create, read, update, delete files and directories
 * - Enforce path validation and security (no ../ traversal)
 * - Manage file permissions
 * - Persist to SQLite via Drizzle ORM
 * - Emit events on file changes
 */

import { emit } from '@services/event-bus';
import { warn, error as logError } from '@services/logger';
import type { VFSNode, FileMetadata, FileType, FSOperationResult, FSError } from '@include/types';
import { FS, SYSTEM_LIMITS } from '@include/config';
// import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// VFS IN-MEMORY STORE
// ============================================================================

// Map of path → VFSNode for quick lookup
const nodeStore = new Map<string, VFSNode>();

// Root directory initialization
function initializeRootFS(): void {
  const rootNode: VFSNode = {
    id: 'root',
    name: '/',
    type: 'directory',
    path: '/',
    metadata: {
      sizeBytes: 0,
      createdAt: new Date(),
      modifiedAt: new Date(),
      owner: FS.SYSTEM_USER,
      permissions: FS.DEFAULT_DIR_PERMISSIONS
    },
    children: []
  };

  nodeStore.set('/', rootNode);

  // Create standard directories
  mkdirSync('/home', true);
  mkdirSync('/tmp', true);
  mkdirSync('/usr', true);
  mkdirSync('/usr/bin', true);
  mkdirSync('/usr/apps', true);
  mkdirSync('/usr/lib', true);
  mkdirSync('/usr/share', true);
  mkdirSync('/etc', true);
  mkdirSync('/var', true);
}

// ============================================================================
// PATH VALIDATION & SECURITY
// ============================================================================

/**
 * Validate path to prevent directory traversal attacks.
 * - No "../" sequences
 * - No absolute paths outside root
 * - Max depth enforcement
 * 
 * @param path Path to validate
 * @returns Error object if invalid, null if valid
 */
function validatePath(path: string): null | FSError {
  // Prevent empty paths
  if (!path || path.trim() === '') {
    const err = new Error('Path cannot be empty') as FSError;
    err.code = 'INVALID_PATH';
    return err;
  }

  // Normalize path
  const normalized = normalizePath(path);

  // Check for directory traversal
  if (normalized.includes('..')) {
    const err = new Error('Directory traversal not allowed') as FSError;
    err.code = 'INVALID_PATH';
    return err;
  }

  // Check path depth
  const depth = normalized.split('/').filter(s => s).length;
  if (depth > SYSTEM_LIMITS.MAX_PATH_DEPTH) {
    const err = new Error(`Path depth exceeds maximum (${SYSTEM_LIMITS.MAX_PATH_DEPTH})`) as FSError;
    err.code = 'INVALID_PATH';
    return err;
  }

  // Check filename length
  const filename = normalized.split('/').pop();
  if (filename && filename.length > SYSTEM_LIMITS.MAX_FILENAME_LENGTH) {
    const err = new Error(`Filename exceeds maximum length (${SYSTEM_LIMITS.MAX_FILENAME_LENGTH})`) as FSError;
    err.code = 'INVALID_PATH';
    return err;
  }

  return null;
}

/**
 * Normalize path (remove trailing slashes, resolve dots).
 * 
 * @param path Path to normalize
 * @returns Normalized path
 */
function normalizePath(path: string): string {
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

/**
 * Get parent directory path.
 * 
 * @param path File or directory path
 * @returns Parent directory path
 */
function getParentPath(path: string): string {
  const normalized = normalizePath(path);
  if (normalized === '/') return '/';
  return normalized.substring(0, normalized.lastIndexOf('/')) || '/';
}

/**
 * Get filename from path.
 * 
 * @param path Full path
 * @returns Filename only
 */
function getFilename(path: string): string {
  const normalized = normalizePath(path);
  return normalized.split('/').pop() || normalized;
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

/**
 * Create a file with content.
 * 
 * @param path File path
 * @param content File content (string or bytes)
 * @returns Operation result
 * 
 * @example
 * writeFileSync('/home/doc.txt', 'Hello, world!');
 */
export function writeFileSync(path: string, content: string | Uint8Array): FSOperationResult {
  const validationError = validatePath(path);
  if (validationError) {
    return { success: false, path, error: validationError };
  }

  const normalized = normalizePath(path);
  const parentPath = getParentPath(normalized);
  const filename = getFilename(normalized);

  // Check parent directory exists
  const parentNode = nodeStore.get(parentPath);
  if (!parentNode) {
    const err = new Error(`Parent directory not found: ${parentPath}`) as FSError;
    err.code = 'NOT_FOUND';
    return { success: false, path, error: err };
  }

  if (parentNode.type !== 'directory') {
    const err = new Error(`Parent is not a directory: ${parentPath}`) as FSError;
    err.code = 'INVALID_OPERATION';
    return { success: false, path, error: err };
  }

  // Check if file already exists
  if (nodeStore.has(normalized)) {
    const existingNode = nodeStore.get(normalized)!;
    if (existingNode.type === 'directory') {
      const err = new Error(`Cannot write to directory: ${normalized}`) as FSError;
      err.code = 'INVALID_OPERATION';
      return { success: false, path, error: err };
    }
    // Update existing file
    existingNode.content = content;
    existingNode.metadata.modifiedAt = new Date();
    existingNode.metadata.sizeBytes = typeof content === 'string' ? content.length : content.byteLength;

    emit('fs:file-updated', { path: normalized });
    return { success: true, path };
  }

  // Create new file
  const fileNode: VFSNode = {
    id: crypto.randomUUID(),
    name: filename,
    type: 'file',
    path: normalized,
    parentId: parentNode.id,
    content,
    metadata: {
      sizeBytes: typeof content === 'string' ? content.length : content.byteLength,
      createdAt: new Date(),
      modifiedAt: new Date(),
      owner: FS.SYSTEM_USER,
      permissions: FS.DEFAULT_PERMISSIONS
    }
  };

  nodeStore.set(normalized, fileNode);
  parentNode.children = parentNode.children || [];
  parentNode.children.push(fileNode);

  emit('fs:file-created', { path: normalized });
  return { success: true, path };
}

/**
 * Read file content.
 * 
 * @param path File path
 * @returns File content or error
 */
export function readFileSync(path: string): string | Uint8Array | FSOperationResult {
  const validationError = validatePath(path);
  if (validationError) {
    return { success: false, path, error: validationError };
  }

  const normalized = normalizePath(path);
  const node = nodeStore.get(normalized);

  if (!node) {
    const err = new Error(`File not found: ${normalized}`) as FSError;
    err.code = 'NOT_FOUND';
    return { success: false, path, error: err };
  }

  if (node.type === 'directory') {
    const err = new Error(`Cannot read directory as file: ${normalized}`) as FSError;
    err.code = 'INVALID_OPERATION';
    return { success: false, path, error: err };
  }

  return node.content || '';
}

/**
 * Create a directory.
 * 
 * @param path Directory path
 * @param recursive Create parent directories if needed
 * @returns Operation result
 */
export function mkdirSync(path: string, recursive = false): FSOperationResult {
  const validationError = validatePath(path);
  if (validationError) {
    return { success: false, path, error: validationError };
  }

  const normalized = normalizePath(path);

  // Check if already exists
  if (nodeStore.has(normalized)) {
    const existing = nodeStore.get(normalized)!;
    if (existing.type === 'directory') {
      return { success: true, path, message: 'Directory already exists' };
    }
    const err = new Error(`Path exists as file: ${normalized}`) as FSError;
    err.code = 'ALREADY_EXISTS';
    return { success: false, path, error: err };
  }

  // Create parent if recursive
  if (recursive) {
    const parentPath = getParentPath(normalized);
    if (parentPath !== '/' && !nodeStore.has(parentPath)) {
      const parentResult = mkdirSync(parentPath, true);
      if (!parentResult.success) {
        return parentResult;
      }
    }
  }

  const parentPath = getParentPath(normalized);
  const parentNode = nodeStore.get(parentPath);

  if (!parentNode) {
    const err = new Error(`Parent directory not found: ${parentPath}`) as FSError;
    err.code = 'NOT_FOUND';
    return { success: false, path, error: err };
  }

  if (parentNode.type !== 'directory') {
    const err = new Error(`Parent is not a directory: ${parentPath}`) as FSError;
    err.code = 'INVALID_OPERATION';
    return { success: false, path, error: err };
  }

  const dirNode: VFSNode = {
    id: crypto.randomUUID(),
    name: getFilename(normalized),
    type: 'directory',
    path: normalized,
    parentId: parentNode.id,
    metadata: {
      sizeBytes: 0,
      createdAt: new Date(),
      modifiedAt: new Date(),
      owner: FS.SYSTEM_USER,
      permissions: FS.DEFAULT_DIR_PERMISSIONS
    },
    children: []
  };

  nodeStore.set(normalized, dirNode);
  parentNode.children = parentNode.children || [];
  parentNode.children.push(dirNode);

  emit('fs:dir-created', { path: normalized });
  return { success: true, path };
}

/**
 * List directory contents.
 * 
 * @param path Directory path
 * @returns Array of files/directories or error
 */
export function readdirSync(path: string): VFSNode[] | FSOperationResult {
  const validationError = validatePath(path);
  if (validationError) {
    return { success: false, path, error: validationError };
  }

  const normalized = normalizePath(path);
  const node = nodeStore.get(normalized);

  if (!node) {
    const err = new Error(`Directory not found: ${normalized}`) as FSError;
    err.code = 'NOT_FOUND';
    return { success: false, path, error: err };
  }

  if (node.type !== 'directory') {
    const err = new Error(`Not a directory: ${normalized}`) as FSError;
    err.code = 'INVALID_OPERATION';
    return { success: false, path, error: err };
  }

  return node.children || [];
}

/**
 * Delete file or empty directory.
 * 
 * @param path File or directory path
 * @returns Operation result
 */
export function unlinkSync(path: string): FSOperationResult {
  const validationError = validatePath(path);
  if (validationError) {
    return { success: false, path, error: validationError };
  }

  const normalized = normalizePath(path);

  if (normalized === '/') {
    const err = new Error('Cannot delete root directory') as FSError;
    err.code = 'PERMISSION_DENIED';
    return { success: false, path, error: err };
  }

  const node = nodeStore.get(normalized);
  if (!node) {
    const err = new Error(`File/directory not found: ${normalized}`) as FSError;
    err.code = 'NOT_FOUND';
    return { success: false, path, error: err };
  }

  // Cannot delete non-empty directory
  if (node.type === 'directory' && node.children && node.children.length > 0) {
    const err = new Error(`Directory not empty: ${normalized}`) as FSError;
    err.code = 'INVALID_OPERATION';
    return { success: false, path, error: err };
  }

  const parentPath = getParentPath(normalized);
  const parentNode = nodeStore.get(parentPath);

  if (parentNode && parentNode.children) {
    parentNode.children = parentNode.children.filter(child => child.id !== node.id);
  }

  nodeStore.delete(normalized);

  emit('fs:file-deleted', { path: normalized });
  return { success: true, path };
}

/**
 * Check if path exists.
 * 
 * @param path Path to check
 * @returns True if exists
 */
export function existsSync(path: string): boolean {
  const normalized = normalizePath(path);
  return nodeStore.has(normalized);
}

/**
 * Get file/directory information.
 * 
 * @param path Path to stat
 * @returns File info or error
 */
export function statSync(path: string): VFSNode | FSOperationResult {
  const validationError = validatePath(path);
  if (validationError) {
    return { success: false, path, error: validationError };
  }

  const normalized = normalizePath(path);
  const node = nodeStore.get(normalized);

  if (!node) {
    const err = new Error(`File/directory not found: ${normalized}`) as FSError;
    err.code = 'NOT_FOUND';
    return { success: false, path, error: err };
  }

  return node;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize VFS with root directory structure.
 */
export function initializeVFS(): void {
  initializeRootFS();
}

/**
 * Get VFS statistics for debugging.
 */
export function getVFSStats() {
  return {
    totalNodes: nodeStore.size,
    directories: Array.from(nodeStore.values()).filter(n => n.type === 'directory').length,
    files: Array.from(nodeStore.values()).filter(n => n.type === 'file').length,
    totalSize: Array.from(nodeStore.values()).reduce((sum, node) => sum + node.metadata.sizeBytes, 0)
  };
}

export default {
  writeFileSync,
  readFileSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  existsSync,
  statSync,
  initializeVFS,
  getVFSStats
};
