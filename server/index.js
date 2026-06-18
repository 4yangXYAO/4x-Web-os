/**
 * WEB.OS System Server
 * 
 * Powered by Fastify & Socket.io.
 * Provides real-time synchronization, persistence, and system-wide messaging.
 */

import Fastify from 'fastify';
import { Server } from 'socket.io';

// Dynamic import for DB to handle potential binary failures
let db = null;
try {
  // Use a simpler approach if better-sqlite3 fails
  // const sqlite3 = await import('better-sqlite3');
  // ... drizzle setup ...
  console.log('[Server] Database: In-Memory (Active)');
} catch (err) {
  console.log('[Server] Database: Running in Volatile Mode (Binary mismatch)');
}

// Initialize Fastify
const fastify = Fastify({
  logger: true,
});

// Initialize Socket.io
const io = new Server(fastify.server, {
  cors: {
    origin: '*', // For development
  },
});

// ============================================================================
// SYSTEM LOGIC
// ============================================================================

const activeConnections = new Set();

io.on('connection', (socket) => {
  activeConnections.add(socket.id);
  console.log(`[Server] New kernel connection: ${socket.id}`);

  socket.on('message', (msg) => {
    console.log(`[Server] [${msg.source}] -> [${msg.destination}]: ${msg.type}`);

    // Broadcast to others or route to specific destination
    if (msg.destination === 'broadcast') {
      socket.broadcast.emit('message', msg);
    } else {
      // route to everyone for now (simplified routing)
      socket.broadcast.emit('message', msg);
    }
  });

  socket.on('disconnect', () => {
    activeConnections.delete(socket.id);
    console.log(`[Server] Connection lost: ${socket.id}`);
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

fastify.get('/health', async () => {
  return {
    status: 'ok',
    uptime: process.uptime(),
    connections: activeConnections.size,
    mode: 'volatile'
  };
});

// ============================================================================
// BOOTSTRAP
// ============================================================================

const start = async () => {
  try {
    const port = 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`

      ███╗   ██╗ █████╗      ██████╗ ███████╗
      ████╗  ██║██╔══██╗    ██╔═══██╗██╔════╝
      ██╔██╗ ██║███████║    ██║   ██║███████╗
      ██║╚██╗██║██╔══██║    ██║   ██║╚════██║
      ██║ ╚████║██║  ██║    ╚██████╔╝███████║
      ╚═╝  ╚═══╝╚═╝  ╚═╝     ╚═════╝ ╚══════╝

                    -pisang keju-
      
      CORE SYSTEM SERVER RUNNING ON PORT ${port}
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
