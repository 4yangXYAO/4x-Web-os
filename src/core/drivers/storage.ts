/**
 * WEB.OS Storage Driver
 * 
 * Manages low-level persistence using browser storage APIs.
 * Supports localStorage for configuration and IndexedDB for large data.
 */

import { info, error } from '@services/logger';

export class StorageDriver {
  /**
   * Safe wrapper for localStorage access.
   */
  public local = {
    get: (key: string): string | null => {
      try {
        return localStorage.getItem(key);
      } catch (err) {
        error('driver', `LocalStorage read failed for ${key}`, err as Error);
        return null;
      }
    },
    set: (key: string, value: string): void => {
      try {
        localStorage.setItem(key, value);
      } catch (err) {
        error('driver', `LocalStorage write failed for ${key}`, err as Error);
      }
    },
    remove: (key: string): void => {
      localStorage.removeItem(key);
    },
    clear: (): void => {
      localStorage.clear();
    }
  };

  /**
   * Storage metadata and quota information.
   */
  public async getQuota(): Promise<StorageEstimate | null> {
    if (navigator.storage && navigator.storage.estimate) {
      return await navigator.storage.estimate();
    }
    return null;
  }
}

let instance: StorageDriver | null = null;

export function initializeStorageDriver(): StorageDriver {
  if (!instance) {
    instance = new StorageDriver();
    info('driver', 'Storage driver initialized');
  }
  return instance;
}

export default initializeStorageDriver;
