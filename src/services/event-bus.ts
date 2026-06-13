/**
 * NA.os Event Bus Service
 * 
 * Pub/Sub system for inter-component communication.
 * Decouples components by using events instead of direct method calls.
 * 
 * Responsibilities:
 * - Register/unregister event listeners
 * - Publish events with payload
 * - Support wildcard subscriptions
 * - Error handling for failed handlers
 */

import { error as logError } from './logger';
import type { EventType, EventHandler, EventPayload } from '@include/types';

// ============================================================================
// EVENT REGISTRY
// ============================================================================

type EventHandlerEntry<T = unknown> = {
  handler: EventHandler<T>;
  once: boolean;
  source?: string;
};

// Global event registry: event type → handlers
const eventRegistry = new Map<EventType, EventHandlerEntry[]>();

// Track all subscriptions for debugging
const subscriptionMetrics = new Map<EventType, number>();

// ============================================================================
// EVENT SUBSCRIPTION
// ============================================================================

/**
 * Subscribe to event type.
 * Handler will be called whenever event is published.
 * 
 * @param eventType Event type to listen for
 * @param handler Callback function
 * @param source Optional source identifier for debugging
 * @returns Unsubscribe function
 * 
 * @example
 * const unsub = on('user-login', (payload) => {
 *   console.log('User logged in:', payload);
 * });
 * 
 * // Later:
 * unsub(); // Stop listening
 */
export function on<T = unknown>(
  eventType: EventType,
  handler: EventHandler<T>,
  source?: string
): () => void {
  if (!eventRegistry.has(eventType)) {
    eventRegistry.set(eventType, []);
    subscriptionMetrics.set(eventType, 0);
  }

  const entry: EventHandlerEntry<T> = { handler, once: false, source };
  eventRegistry.get(eventType)!.push(entry);

  // Increment subscription count
  subscriptionMetrics.set(eventType, (subscriptionMetrics.get(eventType) || 0) + 1);

  // Return unsubscribe function
  return () => {
    const handlers = eventRegistry.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(entry);
      if (index > -1) {
        handlers.splice(index, 1);
        subscriptionMetrics.set(eventType, (subscriptionMetrics.get(eventType) || 1) - 1);

        // Clean up empty registries
        if (handlers.length === 0) {
          eventRegistry.delete(eventType);
          subscriptionMetrics.delete(eventType);
        }
      }
    }
  };
}

/**
 * Subscribe to event type, but only once.
 * Handler will be automatically unsubscribed after first call.
 * 
 * @param eventType Event type to listen for
 * @param handler Callback function
 * @param source Optional source identifier
 * @returns Unsubscribe function
 */
export function once<T = unknown>(
  eventType: EventType,
  handler: EventHandler<T>,
  source?: string
): () => void {
  if (!eventRegistry.has(eventType)) {
    eventRegistry.set(eventType, []);
    subscriptionMetrics.set(eventType, 0);
  }

  const wrappedHandler: EventHandler<T> = async (payload) => {
    try {
      await handler(payload);
    } finally {
      // Auto-unsubscribe after call
      const handlers = eventRegistry.get(eventType);
      if (handlers) {
        const index = handlers.findIndex(h => h.handler === wrappedHandler);
        if (index > -1) {
          handlers.splice(index, 1);
          subscriptionMetrics.set(eventType, (subscriptionMetrics.get(eventType) || 1) - 1);

          if (handlers.length === 0) {
            eventRegistry.delete(eventType);
            subscriptionMetrics.delete(eventType);
          }
        }
      }
    }
  };

  const entry: EventHandlerEntry<T> = { handler: wrappedHandler, once: true, source };
  eventRegistry.get(eventType)!.push(entry);

  subscriptionMetrics.set(eventType, (subscriptionMetrics.get(eventType) || 0) + 1);

  return () => {
    const handlers = eventRegistry.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(entry);
      if (index > -1) {
        handlers.splice(index, 1);
        subscriptionMetrics.set(eventType, (subscriptionMetrics.get(eventType) || 1) - 1);

        if (handlers.length === 0) {
          eventRegistry.delete(eventType);
          subscriptionMetrics.delete(eventType);
        }
      }
    }
  };
}

/**
 * Unsubscribe all handlers for an event type.
 * 
 * @param eventType Event type (or leave empty to unsubscribe all)
 */
export function off(eventType?: EventType): void {
  if (eventType) {
    eventRegistry.delete(eventType);
    subscriptionMetrics.delete(eventType);
  } else {
    eventRegistry.clear();
    subscriptionMetrics.clear();
  }
}

// ============================================================================
// EVENT PUBLISHING
// ============================================================================

/**
 * Publish event to all subscribers.
 * Handlers are called in order of subscription.
 * 
 * @param eventType Event type to publish
 * @param payload Event data
 * @param source Optional source identifier
 * 
 * @example
 * emit('user-login', { userId: '123', username: 'john' });
 * 
 * // With source tracking:
 * emit('file-saved', { path: '/doc.txt' }, 'word-editor');
 */
export async function emit<T = unknown>(
  eventType: EventType,
  payload: T,
  source?: string
): Promise<void> {
  const handlers = eventRegistry.get(eventType);
  if (!handlers || handlers.length === 0) {
    return; // No handlers, silent success
  }

  // Execute all handlers in sequence
  for (const entry of handlers) {
    try {
      await entry.handler(payload);
    } catch (err) {
      logError(
        '[EventBus]',
        `Handler error for event '${eventType}'`,
        err instanceof Error ? err : new Error(String(err))
      );
      // Don't re-throw—continue with other handlers
    }
  }
}

/**
 * Publish event and wait for all async handlers to complete.
 * Same as emit() but explicitly typed for async handlers.
 * 
 * @param eventType Event type
 * @param payload Event data
 * @param source Optional source
 */
export async function emitAsync<T = unknown>(
  eventType: EventType,
  payload: T,
  source?: string
): Promise<void> {
  return emit(eventType, payload, source);
}

/**
 * Publish event and collect results from all handlers.
 * Useful when handlers return values (e.g., validators).
 * 
 * @param eventType Event type
 * @param payload Event data
 * @returns Array of handler results
 * 
 * @example
 * // Validators return true/false
 * const results = await emitWithResults('validate-file', { data });
 * const allValid = results.every(r => r === true);
 */
export async function emitWithResults<T = unknown, R = unknown>(
  eventType: EventType,
  payload: T
): Promise<R[]> {
  const handlers = eventRegistry.get(eventType);
  if (!handlers || handlers.length === 0) {
    return [];
  }

  const results: R[] = [];

  for (const entry of handlers) {
    try {
      const result = await entry.handler(payload);
      results.push(result as R);
    } catch (err) {
      logError(
        '[EventBus]',
        `Handler error for event '${eventType}'`,
        err instanceof Error ? err : new Error(String(err))
      );
      results.push(undefined as R);
    }
  }

  return results;
}

// ============================================================================
// EVENT NAMESPACING
// ============================================================================

/**
 * Create a namespace for event types to avoid collisions.
 * 
 * @param namespace Namespace prefix (e.g., 'terminal')
 * @returns Object with on(), once(), emit() methods
 * 
 * @example
 * const terminalEvents = namespace('terminal');
 * terminalEvents.on('input', (text) => { ... });
 * terminalEvents.emit('input', 'ls -la');
 */
export function namespace(namespace: string) {
  const prefix = `${namespace}:`;

  return {
    on: <T = unknown>(event: string, handler: EventHandler<T>, source?: string) =>
      on<T>(`${prefix}${event}`, handler, source),
    once: <T = unknown>(event: string, handler: EventHandler<T>, source?: string) =>
      once<T>(`${prefix}${event}`, handler, source),
    emit: <T = unknown>(event: string, payload: T, source?: string) =>
      emit(`${prefix}${event}`, payload, source),
    off: (event?: string) =>
      off(event ? `${prefix}${event}` : undefined)
  };
}

// ============================================================================
// DEBUGGING & METRICS
// ============================================================================

/**
 * Get subscription metrics for debugging.
 * 
 * @returns Map of event types to subscription counts
 */
export function getMetrics() {
  return new Map(subscriptionMetrics);
}

/**
 * Get all registered event types.
 * 
 * @returns Array of event type names
 */
export function getEventTypes(): string[] {
  return Array.from(eventRegistry.keys());
}

/**
 * Get handler count for event type.
 * 
 * @param eventType Event type
 * @returns Number of registered handlers
 */
export function getHandlerCount(eventType: EventType): number {
  return eventRegistry.get(eventType)?.length || 0;
}

/**
 * Print debug information about event bus state.
 */
export function debugPrint(): void {
  console.group('[EventBus] Debug Info');
  console.log('Registered events:', getEventTypes());
  console.log('Metrics:', Object.fromEntries(getMetrics()));
  console.log('Total handlers:', Array.from(eventRegistry.values()).reduce((sum, handlers) => sum + handlers.length, 0));
  console.groupEnd();
}

export default {
  on,
  once,
  off,
  emit,
  emitAsync,
  emitWithResults,
  namespace,
  getMetrics,
  getEventTypes,
  getHandlerCount,
  debugPrint
};
