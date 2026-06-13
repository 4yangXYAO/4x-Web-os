/**
 * Event Bus Tests
 * 
 * Validates pub/sub functionality, error handling, and subscription management.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { on, once, off, emit, namespace, getMetrics, getEventTypes, getHandlerCount } from '@services/event-bus';

describe('Event Bus - Basic Subscription', () => {
  beforeEach(() => {
    off(); // Clear all subscriptions
  });

  it('should register event listener', (done) => {
    on('test-event', (payload) => {
      expect(payload).toBe('test-data');
      done();
    });

    emit('test-event', 'test-data');
  });

  it('should return unsubscribe function', () => {
    let called = false;
    const unsub = on('test-event', () => {
      called = true;
    });

    expect(typeof unsub).toBe('function');

    unsub();
    emit('test-event', 'data');

    expect(called).toBe(false);
  });

  it('should handle multiple subscribers', async () => {
    const results: string[] = [];

    on('test-event', () => results.push('handler1'));
    on('test-event', () => results.push('handler2'));
    on('test-event', () => results.push('handler3'));

    await emit('test-event', null);

    expect(results.length).toBe(3);
    expect(results).toEqual(['handler1', 'handler2', 'handler3']);
  });

  it('should pass payload to handlers', async () => {
    const payloads: any[] = [];

    on('test-event', (p) => payloads.push(p));
    on('test-event', (p) => payloads.push(p));

    await emit('test-event', { id: 123 });

    expect(payloads).toEqual([{ id: 123 }, { id: 123 }]);
  });
});

describe('Event Bus - One-time Subscription', () => {
  beforeEach(() => {
    off();
  });

  it('should call handler only once', async () => {
    let callCount = 0;

    once('test-event', () => {
      callCount++;
    });

    await emit('test-event', null);
    await emit('test-event', null);
    await emit('test-event', null);

    expect(callCount).toBe(1);
  });

  it('should auto-unsubscribe after first call', async () => {
    let callCount = 0;

    once('test-event', () => {
      callCount++;
    });

    await emit('test-event', null);

    // Handler should be gone
    expect(getHandlerCount('test-event')).toBe(0);
  });

  it('should return unsubscribe function for once', async () => {
    let called = false;

    const unsub = once('test-event', () => {
      called = true;
    });

    unsub(); // Unsubscribe before emit

    await emit('test-event', null);

    expect(called).toBe(false);
  });
});

describe('Event Bus - Unsubscription', () => {
  beforeEach(() => {
    off();
  });

  it('should unsubscribe specific handler', async () => {
    let count = 0;

    const unsub = on('test-event', () => {
      count++;
    });

    await emit('test-event', null);
    expect(count).toBe(1);

    unsub();
    await emit('test-event', null);

    expect(count).toBe(1); // Not incremented
  });

  it('should unsubscribe all handlers for event type', async () => {
    on('test-event', () => { });
    on('test-event', () => { });

    off('test-event');

    expect(getHandlerCount('test-event')).toBe(0);
  });

  it('should clear all subscriptions', async () => {
    on('event1', () => { });
    on('event2', () => { });
    on('event3', () => { });

    off();

    expect(getEventTypes().length).toBe(0);
  });
});

describe('Event Bus - Error Handling', () => {
  beforeEach(() => {
    off();
  });

  it('should continue with other handlers on error', async () => {
    const results: string[] = [];

    on('test-event', () => {
      results.push('handler1');
    });

    on('test-event', () => {
      throw new Error('Handler error');
    });

    on('test-event', () => {
      results.push('handler3');
    });

    // Should not throw, should continue
    await emit('test-event', null);

    expect(results).toEqual(['handler1', 'handler3']);
  });

  it('should handle async handler errors', async () => {
    const results: string[] = [];

    on('test-event', () => {
      results.push('handler1');
    });

    on('test-event', async () => {
      throw new Error('Async error');
    });

    on('test-event', () => {
      results.push('handler3');
    });

    await emit('test-event', null);

    expect(results).toEqual(['handler1', 'handler3']);
  });
});

describe('Event Bus - Namespacing', () => {
  beforeEach(() => {
    off();
  });

  it('should create namespaced event bus', async () => {
    const appEvents = namespace('app');
    let called = false;

    appEvents.on('start', () => {
      called = true;
    });

    await appEvents.emit('start', null);

    expect(called).toBe(true);
  });

  it('should isolate namespaced events', async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    namespace('app1').on('event', handler1);
    namespace('app2').on('event', handler2);

    await namespace('app1').emit('event', null);

    expect(handler1).toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
  });

  it('should support namespace unsubscribe', async () => {
    const appEvents = namespace('app');
    let callCount = 0;

    appEvents.on('event', () => {
      callCount++;
    });

    await appEvents.emit('event', null);
    expect(callCount).toBe(1);

    appEvents.off('event');

    await appEvents.emit('event', null);
    expect(callCount).toBe(1); // Not incremented
  });
});

describe('Event Bus - Metrics & Debugging', () => {
  beforeEach(() => {
    off();
  });

  it('should track subscription metrics', async () => {
    on('event1', () => { });
    on('event1', () => { });
    on('event2', () => { });

    const metrics = getMetrics();

    expect(metrics.get('event1')).toBe(2);
    expect(metrics.get('event2')).toBe(1);
  });

  it('should list all event types', () => {
    on('event1', () => { });
    on('event2', () => { });
    on('event3', () => { });

    const types = getEventTypes();

    expect(types).toContain('event1');
    expect(types).toContain('event2');
    expect(types).toContain('event3');
  });

  it('should report handler count per event', () => {
    on('test-event', () => { });
    on('test-event', () => { });
    on('test-event', () => { });

    expect(getHandlerCount('test-event')).toBe(3);
  });

  it('should return 0 for non-existent event', () => {
    expect(getHandlerCount('nonexistent')).toBe(0);
  });
});

describe('Event Bus - Async Handlers', () => {
  beforeEach(() => {
    off();
  });

  it('should wait for async handlers', async () => {
    const results: string[] = [];

    on('test-event', async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      results.push('async1');
    });

    on('test-event', async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      results.push('async2');
    });

    await emit('test-event', null);

    // Both should have completed
    expect(results.length).toBe(2);
  });
});

describe('Event Bus - Edge Cases', () => {
  beforeEach(() => {
    off();
  });

  it('should handle emit with no subscribers', async () => {
    // Should not throw
    await emit('nonexistent-event', null);
    expect(true).toBe(true);
  });

  it('should handle unsubscribe of already-unsubscribed handler', async () => {
    const unsub = on('test-event', () => { });

    unsub();
    unsub(); // Should not throw

    expect(true).toBe(true);
  });

  it('should handle multiple unsub calls', async () => {
    let callCount = 0;
    const unsub1 = on('test-event', () => {
      callCount++;
    });
    const unsub2 = on('test-event', () => {
      callCount++;
    });

    unsub1();
    unsub1(); // Duplicate unsubscribe

    await emit('test-event', null);

    expect(callCount).toBe(1); // Only unsub2 handler should fire
  });

  it('should handle null payload', async () => {
    let received = null;

    on('test-event', (payload) => {
      received = payload;
    });

    await emit('test-event', null);

    expect(received).toBeNull();
  });

  it('should handle undefined payload', async () => {
    let received = 'not set';

    on('test-event', (payload) => {
      received = payload;
    });

    await emit('test-event', undefined);

    expect(received).toBeUndefined();
  });
});
