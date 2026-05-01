'use strict';

const { Server }      = require('socket.io');
const { verifyAccessToken } = require('../config/jwt');
const { setupOrderSockets } = require('./order.socket');

/**
 * Attach Socket.IO to the HTTP server.
 * All sockets must present a valid JWT in the auth handshake.
 */
function setupSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  // ── Authentication middleware ─────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.user = verifyAccessToken(token);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── Connection handler ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`[socket] connected uid=${socket.user.id}`);

    // Client joins its own room so the server can push targeted events
    socket.on('join_room', ({ role, userId }) => {
      if (userId === socket.user.id) {
        socket.join(`user:${userId}`);
        console.log(`[socket] user:${userId} joined`);
      }
      if (role === 'vendor') {
        socket.join(`vendor:${socket.user.id}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[socket] disconnected uid=${socket.user.id}`);
    });
  });

  // Attach order-specific event helpers and expose io on the module
  setupOrderSockets(io);

  // Make io accessible to other modules via require('../sockets').io
  module.exports.io = io;

  return io;
}

module.exports = { setupSockets };
