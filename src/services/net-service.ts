/**
 * NA.os Networking Service
 * 
 * Manages real-time communication via Socket.io.
 * Handles server connections, message routing, and peer-to-peer data.
 * 
 * Responsibilities:
 * - Maintain connection to Fastify backend
 * - Send and receive system messages/commands
 * - Handle real-time notifications
 * - Enforce rate limits and payload validation
 */

import { io, Socket } from 'socket.io-client';
import { emit } from './event-bus';
import { info, warn, error as logError } from './logger';
import { SECURITY, SYSTEM_LIMITS } from '@include/config';
import type { SocketMessage, Result } from '@include/types';

// ============================================================================
// SERVICE STATE
// ============================================================================

let socket: Socket | null = null;
let isConnected = false;
let messageCount = 0;
let lastResetTime = Date.now();

// ============================================================================
// CONNECTION MANAGEMENT
// ============================================================================

/**
 * Initialize networking service and connect to server.
 * 
 * @param url Server URL (defaults to window.origin)
 */
export function initializeNet(url: string = window.location.origin): void {
  if (socket) return;

  info('net', `Connecting to system server: ${url}`);

  socket = io(url, {
    reconnection: true,
    reconnectionAttempts: 5,
    timeout: SYSTEM_LIMITS.SOCKET_TIMEOUT,
    autoConnect: true
  });

  setupListeners();
}

/**
 * Set up socket event listeners.
 */
function setupListeners(): void {
  if (!socket) return;

  socket.on('connect', () => {
    isConnected = true;
    info('net', 'Connected to system server', { id: socket?.id });
    emit('net:connected', { id: socket?.id });
  });

  socket.on('disconnect', (reason) => {
    isConnected = false;
    warn('net', 'Disconnected from server', { reason });
    emit('net:disconnected', { reason });
  });

  socket.on('connect_error', (err) => {
    logError('net', 'Connection error', err);
    emit('net:error', { error: err.message });
  });

  // Global message handler
  socket.on('message', (msg: SocketMessage) => {
    handleIncomingMessage(msg);
  });
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

/**
 * Send a message to the server.
 * 
 * @param type Message type
 * @param payload Data to send
 * @param destination Target service/app
 * @returns Result indicating if message was queued/sent
 */
export function sendMessage(
  type: SocketMessage['type'],
  payload: unknown,
  destination: string = 'system'
): Result<boolean, Error> {
  if (!socket || !isConnected) {
    return { ok: false, error: new Error('Network not connected') };
  }

  // Rate limiting
  if (isRateLimited()) {
    warn('net', 'Message rate limit exceeded');
    return { ok: false, error: new Error('Rate limit exceeded') };
  }

  const message: Partial<SocketMessage> = {
    id: crypto.randomUUID(),
    type,
    payload,
    destination,
    source: 'kernel', // Default source
    timestamp: new Date()
  };

  // Validate payload size
  const payloadStr = JSON.stringify(payload);
  if (payloadStr.length > SYSTEM_LIMITS.MAX_MESSAGE_SIZE) {
    return { ok: false, error: new Error('Payload size exceeds limit') };
  }

  socket.emit('message', message);
  messageCount++;
  
  return { ok: true, value: true };
}

/**
 * Handle messages received from the server.
 * 
 * @param msg Incoming socket message
 */
function handleIncomingMessage(msg: SocketMessage): void {
  // Validate message
  if (!msg.type || !msg.id) {
    warn('net', 'Received malformed message', { msg });
    return;
  }

  info('net', `Received ${msg.type} from ${msg.source}`, { type: msg.type });

  // Route through event bus
  // Format: net:msg:{type}
  emit(`net:msg:${msg.type}`, msg);
}

/**
 * Check if current message rate exceeds security policy.
 */
function isRateLimited(): boolean {
  const now = Date.now();
  if (now - lastResetTime > 1000) {
    messageCount = 0;
    lastResetTime = now;
  }

  return messageCount >= SECURITY.RATE_LIMIT_MSG_PER_SEC;
}

// ============================================================================
// PUBLIC API
// ============================================================================

export function getStatus() {
  return {
    connected: isConnected,
    id: socket?.id,
    latency: (socket as any)?.latency || 0
  };
}

export default {
  initializeNet,
  sendMessage,
  getStatus
};
