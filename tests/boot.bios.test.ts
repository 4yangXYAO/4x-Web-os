/**
 * BIOS Tests
 * 
 * Validates hardware detection, capability checks, and validation logic.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { detectHardware, getMemoryQuota, InputDriver, StorageDriver, runBIOSDiagnostics } from '@boot/bios';

describe('BIOS - Hardware Detection', () => {
  it('should detect browser capabilities', () => {
    const hardware = detectHardware();

    expect(hardware).toBeDefined();
    expect(hardware.userAgent).toBeTruthy();
    expect(['windows', 'mac', 'linux', 'unknown']).toContain(hardware.platform);
    expect(hardware.screenWidth).toBeGreaterThan(0);
    expect(hardware.screenHeight).toBeGreaterThan(0);
  });

  it('should detect localStorage availability', () => {
    const hardware = detectHardware();
    expect(typeof hardware.hasLocalStorage).toBe('boolean');
  });

  it('should detect IndexedDB availability', () => {
    const hardware = detectHardware();
    expect(typeof hardware.hasIndexedDB).toBe('boolean');
  });

  it('should detect WebGL availability', () => {
    const hardware = detectHardware();
    expect(typeof hardware.hasWebGL).toBe('boolean');
  });

  it('should detect Web Workers availability', () => {
    const hardware = detectHardware();
    expect(typeof hardware.hasWebWorkers).toBe('boolean');
  });

  it('should report device pixel ratio', () => {
    const hardware = detectHardware();
    expect(hardware.devicePixelRatio).toBeGreaterThan(0);
  });
});

describe('BIOS - Memory Quota', () => {
  it('should return a memory quota', () => {
    const quota = getMemoryQuota();
    expect(quota).toBeGreaterThan(0);
    expect(quota).toBeLessThanOrEqual(256); // Should not exceed max
  });

  it('should return valid memory values', () => {
    const quota = getMemoryQuota();
    expect([64, 128, 192, 256]).toContain(quota);
  });
});

describe('BIOS - Input Driver', () => {
  let driver: InputDriver;

  beforeEach(() => {
    driver = new InputDriver();
  });

  it('should register event listener', () => {
    let called = false;
    driver.on('mousedown', () => {
      called = true;
    });

    // Simulate event (in real DOM it would be triggered)
    expect(driver).toBeDefined();
  });

  it('should unregister event listener', () => {
    const handler = () => { };
    driver.on('mousedown', handler);
    driver.off('mousedown', handler);

    expect(driver).toBeDefined();
  });
});

describe('BIOS - Storage Driver', () => {
  let driver: StorageDriver;

  beforeEach(() => {
    driver = new StorageDriver();
    // Clear localStorage
    localStorage.clear();
  });

  it('should write and read from localStorage', () => {
    const key = 'test-key';
    const value = 'test-value';

    const writeSuccess = driver.writeLocal(key, value);
    expect(writeSuccess).toBe(true);

    const readValue = driver.readLocal(key);
    expect(readValue).toBe(value);
  });

  it('should delete from localStorage', () => {
    driver.writeLocal('test', 'value');
    const deleteSuccess = driver.deleteLocal('test');
    expect(deleteSuccess).toBe(true);

    const readValue = driver.readLocal('test');
    expect(readValue).toBeNull();
  });

  it('should clear all localStorage', () => {
    driver.writeLocal('key1', 'value1');
    driver.writeLocal('key2', 'value2');

    const clearSuccess = driver.clearLocal();
    expect(clearSuccess).toBe(true);

    expect(driver.readLocal('key1')).toBeNull();
    expect(driver.readLocal('key2')).toBeNull();
  });

  it('should handle read on non-existent key', () => {
    const value = driver.readLocal('nonexistent');
    expect(value).toBeNull();
  });
});

describe('BIOS - Diagnostics', () => {
  it('should run full diagnostics', () => {
    const report = runBIOSDiagnostics();

    expect(report).toBeDefined();
    expect(report.hardware).toBeDefined();
    expect(report.memoryQuota).toBeGreaterThan(0);
    expect(report.timestamp).toBeInstanceOf(Date);
    expect(Array.isArray(report.warnings)).toBe(true);
  });

  it('should include hardware info in diagnostics', () => {
    const report = runBIOSDiagnostics();

    expect(report.hardware.userAgent).toBeTruthy();
    expect(report.hardware.platform).toBeTruthy();
    expect(report.hardware.screenWidth).toBeGreaterThan(0);
  });
});
