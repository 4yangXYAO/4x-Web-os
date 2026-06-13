/**
 * NA.os Memory Manager
 * 
 * Manages system-wide memory allocation and caching.
 * Enforces memory quotas and provides a centralized cache.
 * 
 * Responsibilities:
 * - Track memory usage across all processes
 * - Enforce total system memory quota
 * - Provide a TTL-based caching layer
 * - Provide memory statistics for system monitoring
 */

import { info, warn } from '@services/logger';
import { emit } from '@services/event-bus';
import type { 
  MemoryStats, 
  CacheEntry, 
  Result 
} from '@include/types';
import { SYSTEM_LIMITS } from '@include/config';

// ============================================================================
// MEMORY STATE
// ============================================================================

// Tracking memory allocated to each PID
const allocationMap = new Map<string, number>();

// Cache store
const cache = new Map<string, CacheEntry<any>>();

// Cache hits/misses for metrics
let cacheHits = 0;
let cacheMisses = 0;

// ============================================================================
// ALLOCATION MANAGEMENT
// ============================================================================

/**
 * Allocate memory to a process.
 * 
 * @param pid Process ID
 * @param amountMB Amount in MB
 * @returns Result indicating success or failure
 */
export function allocate(pid: string, amountMB: number): Result<boolean, Error> {
  const currentTotal = getTotalUsed();
  
  if (currentTotal + amountMB > SYSTEM_LIMITS.TOTAL_MEMORY_QUOTA) {
    warn('kernel', 'Memory allocation failed: total quota exceeded', { requestedMB: amountMB, currentTotalMB: currentTotal });
    return { ok: false, error: new Error('System memory quota exceeded') };
  }

  const currentAllocation = allocationMap.get(pid) || 0;
  if (currentAllocation + amountMB > SYSTEM_LIMITS.MAX_PROCESS_MEMORY) {
    warn('kernel', 'Memory allocation failed: process quota exceeded', { pid, requestedMB: amountMB });
    return { ok: false, error: new Error('Process memory quota exceeded') };
  }

  allocationMap.set(pid, currentAllocation + amountMB);
  emit('mem:allocated', { pid, amountMB });
  
  return { ok: true, value: true };
}

/**
 * Release memory allocated to a process.
 * 
 * @param pid Process ID
 * @param amountMB Optional amount to release. If omitted, releases all.
 */
export function release(pid: string, amountMB?: number): void {
  const current = allocationMap.get(pid) || 0;
  
  if (amountMB === undefined || amountMB >= current) {
    allocationMap.delete(pid);
  } else {
    allocationMap.set(pid, current - amountMB);
  }
  
  emit('mem:released', { pid, amountMB: amountMB ?? current });
}

/**
 * Get total used memory in MB.
 */
export function getTotalUsed(): number {
  let total = 0;
  for (const amount of allocationMap.values()) {
    total += amount;
  }
  return total;
}

/**
 * Get current system memory stats.
 */
export function getStats(): MemoryStats {
  const used = getTotalUsed();
  const totalRequests = cacheHits + cacheMisses;
  const hitRate = totalRequests === 0 ? 0 : cacheHits / totalRequests;

  return {
    totalMB: SYSTEM_LIMITS.TOTAL_MEMORY_QUOTA,
    usedMB: used,
    freeMB: SYSTEM_LIMITS.TOTAL_MEMORY_QUOTA - used,
    cacheHitRate: hitRate
  };
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Set a value in the system cache.
 * 
 * @param key Cache key
 * @param value Data to store
 * @param ttlMS Time to live in milliseconds (defaults to 1 hour)
 */
export function setCache<T>(key: string, value: T, ttlMS = SYSTEM_LIMITS.CACHE_TTL): void {
  const entry: CacheEntry<T> = {
    key,
    value,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + ttlMS)
  };
  
  cache.set(key, entry);
}

/**
 * Get a value from the system cache.
 * 
 * @param key Cache key
 * @returns Cached value or undefined if expired or not found
 */
export function getCache<T>(key: string): T | undefined {
  const entry = cache.get(key);
  
  if (!entry) {
    cacheMisses++;
    return undefined;
  }

  // Check expiration
  if (entry.expiresAt.getTime() < Date.now()) {
    cache.delete(key);
    cacheMisses++;
    return undefined;
  }

  cacheHits++;
  return entry.value as T;
}

/**
 * Clear all cache entries.
 */
export function clearCache(): void {
  cache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  info('kernel', 'System cache cleared');
}

/**
 * Remove stale entries from cache.
 * Should be called periodically.
 */
export function gcCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt.getTime() < now) {
      cache.delete(key);
    }
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize memory manager.
 */
export function initializeMem(): void {
  allocationMap.clear();
  cache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  info('kernel', 'Memory Manager initialized');
}

export default {
  allocate,
  release,
  getTotalUsed,
  getStats,
  setCache,
  getCache,
  clearCache,
  gcCache,
  initializeMem
};
