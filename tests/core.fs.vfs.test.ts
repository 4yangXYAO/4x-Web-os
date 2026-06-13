/**
 * Virtual File System (VFS) Tests
 * 
 * Validates file operations, path security, and directory management.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  writeFileSync,
  readFileSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  existsSync,
  statSync,
  initializeVFS,
  getVFSStats
} from '@core/fs/vfs';

describe('VFS - Initialization', () => {
  it('should initialize root filesystem', () => {
    initializeVFS();

    expect(existsSync('/')).toBe(true);
    expect(existsSync('/home')).toBe(true);
    expect(existsSync('/tmp')).toBe(true);
    expect(existsSync('/usr')).toBe(true);
  });

  it('should create standard directories', () => {
    initializeVFS();

    expect(existsSync('/usr/bin')).toBe(true);
    expect(existsSync('/usr/apps')).toBe(true);
    expect(existsSync('/usr/lib')).toBe(true);
    expect(existsSync('/usr/share')).toBe(true);
  });
});

describe('VFS - File Operations', () => {
  beforeEach(() => {
    initializeVFS();
  });

  it('should create and read file', () => {
    const path = '/home/test.txt';
    const content = 'Hello, world!';

    const writeResult = writeFileSync(path, content);
    expect(writeResult.success).toBe(true);

    const readContent = readFileSync(path);
    expect(readContent).toBe(content);
  });

  it('should overwrite existing file', () => {
    const path = '/home/file.txt';

    writeFileSync(path, 'original');
    writeFileSync(path, 'updated');

    const content = readFileSync(path);
    expect(content).toBe('updated');
  });

  it('should return error when reading non-existent file', () => {
    const result = readFileSync('/home/nonexistent.txt');

    expect(result).toHaveProperty('success');
    expect((result as any).success).toBe(false);
    expect((result as any).error).toBeDefined();
  });

  it('should handle binary content', () => {
    const path = '/home/binary.bin';
    const buffer = new Uint8Array([1, 2, 3, 4, 5]);

    writeFileSync(path, buffer);
    const readBuffer = readFileSync(path);

    expect(readBuffer).toEqual(buffer);
  });

  it('should prevent reading directory as file', () => {
    mkdirSync('/home/mydir');
    const result = readFileSync('/home/mydir');

    expect((result as any).success).toBe(false);
    expect((result as any).error.code).toBe('INVALID_OPERATION');
  });
});

describe('VFS - Directory Operations', () => {
  beforeEach(() => {
    initializeVFS();
  });

  it('should create directory', () => {
    const result = mkdirSync('/home/documents');

    expect(result.success).toBe(true);
    expect(existsSync('/home/documents')).toBe(true);
  });

  it('should create nested directories with recursive flag', () => {
    const result = mkdirSync('/home/documents/projects/2024', true);

    expect(result.success).toBe(true);
    expect(existsSync('/home/documents')).toBe(true);
    expect(existsSync('/home/documents/projects')).toBe(true);
    expect(existsSync('/home/documents/projects/2024')).toBe(true);
  });

  it('should fail to create nested directories without recursive flag', () => {
    const result = mkdirSync('/home/docs/nested');

    expect(result.success).toBe(false);
  });

  it('should list directory contents', () => {
    mkdirSync('/home/testdir', true);
    writeFileSync('/home/testdir/file1.txt', 'content1');
    writeFileSync('/home/testdir/file2.txt', 'content2');

    const contents = readdirSync('/home/testdir');

    expect(Array.isArray(contents)).toBe(true);
    expect((contents as any).length).toBe(2);
  });

  it('should prevent creating directory in file', () => {
    writeFileSync('/home/file.txt', 'content');
    const result = mkdirSync('/home/file.txt/subdir');

    expect(result.success).toBe(false);
  });
});

describe('VFS - File Deletion', () => {
  beforeEach(() => {
    initializeVFS();
  });

  it('should delete file', () => {
    writeFileSync('/home/temp.txt', 'temp');
    expect(existsSync('/home/temp.txt')).toBe(true);

    const result = unlinkSync('/home/temp.txt');
    expect(result.success).toBe(true);
    expect(existsSync('/home/temp.txt')).toBe(false);
  });

  it('should delete empty directory', () => {
    mkdirSync('/home/empty', true);
    expect(existsSync('/home/empty')).toBe(true);

    const result = unlinkSync('/home/empty');
    expect(result.success).toBe(true);
    expect(existsSync('/home/empty')).toBe(false);
  });

  it('should prevent deleting non-empty directory', () => {
    mkdirSync('/home/nonempty', true);
    writeFileSync('/home/nonempty/file.txt', 'content');

    const result = unlinkSync('/home/nonempty');

    expect(result.success).toBe(false);
    expect((result as any).error.code).toBe('INVALID_OPERATION');
  });

  it('should prevent deleting root directory', () => {
    const result = unlinkSync('/');

    expect(result.success).toBe(false);
    expect((result as any).error.code).toBe('PERMISSION_DENIED');
  });

  it('should return error when deleting non-existent path', () => {
    const result = unlinkSync('/home/nonexistent.txt');

    expect(result.success).toBe(false);
    expect((result as any).error.code).toBe('NOT_FOUND');
  });
});

describe('VFS - Path Validation & Security', () => {
  beforeEach(() => {
    initializeVFS();
  });

  it('should prevent directory traversal', () => {
    const result = writeFileSync('/home/../../../etc/passwd', 'attack');

    expect(result.success).toBe(false);
    expect((result as any).error.code).toBe('INVALID_PATH');
  });

  it('should normalize paths', () => {
    const result1 = writeFileSync('/home//file.txt', 'content');
    expect(result1.success).toBe(true);

    const content = readFileSync('/home/file.txt');
    expect(content).toBe('content');
  });

  it('should handle trailing slashes', () => {
    writeFileSync('/home/file.txt', 'content');
    const content = readFileSync('/home/file.txt/');

    // Should normalize and work
    expect(content).toBe('content');
  });

  it('should prevent extremely deep paths', () => {
    let deepPath = '/';
    for (let i = 0; i < 100; i++) {
      deepPath += `level${i}/`;
    }

    const result = mkdirSync(deepPath, true);

    expect(result.success).toBe(false);
    expect((result as any).error.code).toBe('INVALID_PATH');
  });

  it('should reject empty paths', () => {
    const result = writeFileSync('', 'content');

    expect(result.success).toBe(false);
    expect((result as any).error.code).toBe('INVALID_PATH');
  });
});

describe('VFS - File Stats', () => {
  beforeEach(() => {
    initializeVFS();
  });

  it('should return file stats', () => {
    writeFileSync('/home/file.txt', 'Hello');
    const stats = statSync('/home/file.txt');

    expect((stats as any).name).toBe('file.txt');
    expect((stats as any).type).toBe('file');
    expect((stats as any).metadata.sizeBytes).toBe(5);
  });

  it('should return directory stats', () => {
    mkdirSync('/home/mydir');
    const stats = statSync('/home/mydir');

    expect((stats as any).name).toBe('mydir');
    expect((stats as any).type).toBe('directory');
  });

  it('should return error for non-existent path', () => {
    const result = statSync('/nonexistent');

    expect((result as any).success).toBe(false);
    expect((result as any).error.code).toBe('NOT_FOUND');
  });
});

describe('VFS - Statistics', () => {
  beforeEach(() => {
    initializeVFS();
  });

  it('should report VFS statistics', () => {
    writeFileSync('/home/file1.txt', 'content');
    writeFileSync('/home/file2.txt', 'more content');
    mkdirSync('/home/dir1');

    const stats = getVFSStats();

    expect(stats.totalNodes).toBeGreaterThan(0);
    expect(stats.files).toBeGreaterThanOrEqual(2);
    expect(stats.directories).toBeGreaterThanOrEqual(1);
    expect(stats.totalSize).toBeGreaterThan(0);
  });
});
