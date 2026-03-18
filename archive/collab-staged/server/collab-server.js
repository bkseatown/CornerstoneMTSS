/**
 * collab-server.js
 * Production WebSocket collaboration server for specialist co-teaching
 * Handles real-time sync, session management, and decision logging
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://127.0.0.1:4174',
      'http://localhost:4174',
      'https://bkseatown.github.io'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors());
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({limit: '10mb', extended: true}));

// Data storage (in-memory; would use Redis in production)
const sessions = new Map();
const connections = new Map();
const decisionLogs = new Map();

// Constants
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

// ============================================================
// WebSocket Handlers
// ============================================================

io.on('connection', (socket) => {
  console.log(`🔗 Client connected: ${socket.id}`);

  /**
   * Join collaboration session
   */
  socket.on('join-session', (data) => {
    try {
      const {sessionId, specialistId, name} = data;

      if (!sessionId || !specialistId) {
        socket.emit('error', {message: 'Missing sessionId or specialistId'});
        return;
      }

      // Create session if doesn't exist
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
          id: sessionId,
          specialists: new Map(),
          annotations: [],
          messages: [],
          decisions: [],
          createdAt: Date.now(),
          lastActivity: Date.now()
        });
      }

      // Add specialist to session
      const session = sessions.get(sessionId);
      session.specialists.set(specialistId, {
        id: specialistId,
        socketId: socket.id,
        name: name || 'Specialist',
        joinedAt: Date.now(),
        isActive: true
      });

      // Track connection
      connections.set(socket.id, {sessionId, specialistId});

      // Join room
      socket.join(sessionId);

      console.log(`✓ ${specialistId} joined session ${sessionId}`);

      // Notify others in session
      socket.to(sessionId).emit('specialist-joined', {
        specialistId,
        name: name || 'Specialist',
        timestamp: Date.now(),
        totalSpecialists: session.specialists.size
      });

      // Send session state to joining specialist
      socket.emit('session-state', {
        sessionId,
        specialists: Array.from(session.specialists.values()),
        recentAnnotations: session.annotations.slice(-50),
        recentMessages: session.messages.slice(-20)
      });

      // Update last activity
      session.lastActivity = Date.now();
    } catch (err) {
      console.error('Error in join-session:', err);
      socket.emit('error', {message: 'Failed to join session'});
    }
  });

  /**
   * Handle annotations (highlights, arrows, notes)
   */
  socket.on('annotation-added', (data) => {
    try {
      const conn = connections.get(socket.id);
      if (!conn) return;

      const session = sessions.get(conn.sessionId);
      if (!session) return;

      const annotation = {
        ...data,
        id: data.id || generateId(),
        specialistId: conn.specialistId,
        timestamp: Date.now(),
        sessionId: conn.sessionId
      };

      session.annotations.push(annotation);
      session.lastActivity = Date.now();

      // Broadcast to other specialists
      socket.to(conn.sessionId).emit('annotation-added', annotation);

      console.log(`📍 Annotation added: ${annotation.id}`);
    } catch (err) {
      console.error('Error in annotation-added:', err);
    }
  });

  /**
   * Handle annotation updates
   */
  socket.on('annotation-updated', (data) => {
    try {
      const conn = connections.get(socket.id);
      if (!conn) return;

      socket.to(conn.sessionId).emit('annotation-updated', {
        ...data,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('Error in annotation-updated:', err);
    }
  });

  /**
   * Handle annotation removal
   */
  socket.on('annotation-removed', (data) => {
    try {
      const conn = connections.get(socket.id);
      if (!conn) return;

      const session = sessions.get(conn.sessionId);
      if (session) {
        session.annotations = session.annotations.filter(a => a.id !== data.id);
      }

      socket.to(conn.sessionId).emit('annotation-removed', data);
    } catch (err) {
      console.error('Error in annotation-removed:', err);
    }
  });

  /**
   * Handle decision logging
   */
  socket.on('decision-logged', (data) => {
    try {
      const conn = connections.get(socket.id);
      if (!conn) return;

      const session = sessions.get(conn.sessionId);
      if (!session) return;

      const decision = {
        ...data,
        id: data.id || generateId(),
        specialistId: conn.specialistId,
        sessionId: conn.sessionId,
        timestamp: Date.now()
      };

      session.decisions.push(decision);
      session.lastActivity = Date.now();

      // Store in log
      if (!decisionLogs.has(conn.sessionId)) {
        decisionLogs.set(conn.sessionId, []);
      }
      decisionLogs.get(conn.sessionId).push(decision);

      // Broadcast to session
      io.to(conn.sessionId).emit('decision-logged', decision);

      console.log(`📋 Decision logged: ${decision.decision}`);
    } catch (err) {
      console.error('Error in decision-logged:', err);
    }
  });

  /**
   * Handle messages
   */
  socket.on('chat-message', (data) => {
    try {
      const conn = connections.get(socket.id);
      if (!conn) return;

      const session = sessions.get(conn.sessionId);
      if (!session) return;

      const specialist = session.specialists.get(conn.specialistId);
      const message = {
        id: data.id || generateId(),
        text: data.text,
        specialistId: conn.specialistId,
        specialistName: specialist?.name || 'Specialist',
        timestamp: Date.now(),
        sessionId: conn.sessionId
      };

      session.messages.push(message);
      session.lastActivity = Date.now();

      // Broadcast to session (including sender)
      io.to(conn.sessionId).emit('chat-message', message);

      console.log(`💬 Message sent in ${conn.sessionId}`);
    } catch (err) {
      console.error('Error in chat-message:', err);
    }
  });

  /**
   * Handle cursor movement
   */
  socket.on('cursor-moved', (data) => {
    try {
      const conn = connections.get(socket.id);
      if (!conn) return;

      const session = sessions.get(conn.sessionId);
      if (!session) return;

      const specialist = session.specialists.get(conn.specialistId);

      socket.to(conn.sessionId).emit('cursor-moved', {
        position: data.position,
        specialistId: conn.specialistId,
        specialistName: specialist?.name,
        timestamp: Date.now()
      });
    } catch (err) {
      // Ignore cursor move errors (high frequency)
    }
  });

  /**
   * Handle disconnection
   */
  socket.on('disconnect', () => {
    try {
      const conn = connections.get(socket.id);
      if (!conn) return;

      const session = sessions.get(conn.sessionId);
      if (session) {
        const specialist = session.specialists.get(conn.specialistId);
        session.specialists.delete(conn.specialistId);
        session.lastActivity = Date.now();

        // Notify others
        io.to(conn.sessionId).emit('specialist-left', {
          specialistId: conn.specialistId,
          specialistName: specialist?.name,
          timestamp: Date.now(),
          remainingSpecialists: session.specialists.size
        });

        // Clean up empty sessions
        if (session.specialists.size === 0) {
          console.log(`📭 Session ${conn.sessionId} cleaned up (no specialists)`);
          sessions.delete(conn.sessionId);
        }
      }

      connections.delete(socket.id);
      console.log(`🔌 Client disconnected: ${socket.id}`);
    } catch (err) {
      console.error('Error in disconnect:', err);
    }
  });
});

// ============================================================
// HTTP Routes
// ============================================================

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeSessions: sessions.size,
    activeConnections: connections.size,
    memory: process.memoryUsage()
  });
});

/**
 * Get session info
 */
app.get('/api/session/:id', (req, res) => {
  try {
    const session = sessions.get(req.params.id);
    if (!session) {
      return res.status(404).json({error: 'Session not found'});
    }

    res.json({
      id: session.id,
      specialists: Array.from(session.specialists.values()).map(s => ({
        id: s.id,
        name: s.name,
        joinedAt: s.joinedAt,
        isActive: s.isActive
      })),
      annotationCount: session.annotations.length,
      messageCount: session.messages.length,
      decisionCount: session.decisions.length,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    });
  } catch (err) {
    res.status(500).json({error: 'Failed to get session'});
  }
});

/**
 * Get decisions for session
 */
app.get('/api/session/:id/decisions', (req, res) => {
  try {
    const session = sessions.get(req.params.id);
    if (!session) {
      return res.status(404).json({error: 'Session not found'});
    }

    res.json({
      sessionId: req.params.id,
      decisions: session.decisions,
      count: session.decisions.length
    });
  } catch (err) {
    res.status(500).json({error: 'Failed to get decisions'});
  }
});

/**
 * Export session data
 */
app.get('/api/session/:id/export', (req, res) => {
  try {
    const session = sessions.get(req.params.id);
    if (!session) {
      return res.status(404).json({error: 'Session not found'});
    }

    const exportData = {
      sessionId: session.id,
      exportedAt: new Date().toISOString(),
      duration: session.lastActivity - session.createdAt,
      summary: {
        specialists: Array.from(session.specialists.values()).map(s => s.name),
        annotations: session.annotations.length,
        decisions: session.decisions.length,
        messages: session.messages.length
      },
      decisions: session.decisions,
      messages: session.messages,
      annotationSummary: {
        highlights: session.annotations.filter(a => a.type === 'highlight').length,
        arrows: session.annotations.filter(a => a.type === 'arrow').length,
        notes: session.annotations.filter(a => a.type === 'note').length
      }
    };

    // Option to download as JSON file
    if (req.query.format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="session-${req.params.id}-${Date.now()}.json"`);
    }

    res.json(exportData);
  } catch (err) {
    res.status(500).json({error: 'Failed to export session'});
  }
});

/**
 * List active sessions
 */
app.get('/api/sessions', (req, res) => {
  try {
    const sessionList = Array.from(sessions.values()).map(s => ({
      id: s.id,
      specialistCount: s.specialists.size,
      annotationCount: s.annotations.length,
      decisionCount: s.decisions.length,
      createdAt: s.createdAt,
      lastActivity: s.lastActivity
    }));

    res.json({
      total: sessionList.length,
      sessions: sessionList
    });
  } catch (err) {
    res.status(500).json({error: 'Failed to list sessions'});
  }
});

/**
 * Statistics
 */
app.get('/api/stats', (req, res) => {
  try {
    const allDecisions = Array.from(sessions.values()).flatMap(s => s.decisions);
    const decisionTypes = {};
    allDecisions.forEach(d => {
      decisionTypes[d.decision] = (decisionTypes[d.decision] || 0) + 1;
    });

    res.json({
      timestamp: new Date().toISOString(),
      sessions: {
        active: sessions.size,
        totalCreated: sessions.size + (decisionLogs.size - sessions.size)
      },
      connections: {
        active: connections.size
      },
      decisions: {
        total: allDecisions.length,
        byType: decisionTypes
      },
      memory: process.memoryUsage(),
      uptime: process.uptime()
    });
  } catch (err) {
    res.status(500).json({error: 'Failed to get statistics'});
  }
});

// ============================================================
// Cleanup & Maintenance
// ============================================================

/**
 * Periodic cleanup of old sessions
 */
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;

  sessions.forEach((session, sessionId) => {
    // Remove sessions inactive for more than 24 hours
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      sessions.delete(sessionId);
      cleanedCount++;
    }
  });

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`);
  }
}, CLEANUP_INTERVAL);

/**
 * Periodic status report
 */
setInterval(() => {
  console.log(`📊 Status: ${sessions.size} sessions, ${connections.size} connections`);
}, 5 * 60 * 1000); // Every 5 minutes

// ============================================================
// Error Handling
// ============================================================

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// ============================================================
// Server Startup
// ============================================================

/**
 * Generate unique ID
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`
🚀 Collaboration Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WebSocket URL: ws://${HOST}:${PORT}
REST API: http://${HOST}:${PORT}/api
Health Check: http://${HOST}:${PORT}/api/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Environment: ${process.env.NODE_ENV || 'development'}
Node Version: ${process.version}
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully...');

  server.close(() => {
    console.log('✓ Server closed');
    console.log(`💾 Final state: ${sessions.size} sessions saved`);
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
});

module.exports = server;
