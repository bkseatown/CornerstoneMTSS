/**
 * session-sync.js
 * Real-time session synchronization for collaborative game watching
 * Enables two specialists to view and annotate same game session
 */

const SessionSync = (() => {
  let socket = null;
  let sessionId = null;
  let specialistId = null;
  let isConnected = false;
  let eventListeners = {};

  /**
   * Initialize WebSocket connection
   * @param {string} sessionId - Student game session ID
   * @param {string} specialistId - Unique identifier for this specialist
   * @param {string} wsUrl - WebSocket server URL (default: auto-detect)
   */
  function connect(sessionId, specialistId, wsUrl = null) {
    return new Promise((resolve, reject) => {
      // Determine WebSocket URL if not provided
      if (!wsUrl) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}/collab`;
      }

      try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log('🔗 WebSocket connected');

          // Send join message
          socket.send(JSON.stringify({
            type: 'join-session',
            sessionId,
            specialistId,
            timestamp: Date.now()
          }));

          isConnected = true;
          sessionId = sessionId;
          specialistId = specialistId;

          emitEvent('connected', {sessionId, specialistId});
          resolve(true);
        };

        socket.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          emitEvent('error', error);
          reject(error);
        };

        socket.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          isConnected = false;
          emitEvent('disconnected', {});
        };

        socket.onmessage = (event) => {
          handleMessage(JSON.parse(event.data));
        };
      } catch (err) {
        console.error('❌ Failed to create WebSocket:', err);
        reject(err);
      }
    });
  }

  /**
   * Handle incoming messages from other specialists
   */
  function handleMessage(message) {
    const {type, data, from, timestamp} = message;

    switch (type) {
      case 'annotation-added':
        emitEvent('annotation-added', {...data, from, timestamp});
        break;
      case 'annotation-updated':
        emitEvent('annotation-updated', {...data, from, timestamp});
        break;
      case 'annotation-removed':
        emitEvent('annotation-removed', {...data, from, timestamp});
        break;
      case 'note-added':
        emitEvent('note-added', {...data, from, timestamp});
        break;
      case 'cursor-moved':
        emitEvent('cursor-moved', {...data, from, timestamp});
        break;
      case 'decision-logged':
        emitEvent('decision-logged', {...data, from, timestamp});
        break;
      case 'chat-message':
        emitEvent('chat-message', {...data, from, timestamp});
        break;
      case 'session-updated':
        emitEvent('session-updated', {...data, timestamp});
        break;
      default:
        console.warn('❓ Unknown message type:', type);
    }
  }

  /**
   * Add annotation (highlight/circle/arrow) to game board
   * @param {object} annotation - {type, x, y, color, wordId, ...}
   */
  function addAnnotation(annotation) {
    if (!isConnected) {
      console.warn('⚠️ Not connected to collaboration session');
      return false;
    }

    const message = {
      type: 'annotation-added',
      data: {
        id: generateId(),
        ...annotation,
        createdAt: Date.now()
      }
    };

    socket.send(JSON.stringify(message));

    // Emit locally
    emitEvent('annotation-added', {...message.data, from: specialistId});
    console.log('📍 Annotation added:', annotation.type);

    return true;
  }

  /**
   * Update existing annotation
   * @param {string} annotationId - ID of annotation to update
   * @param {object} updates - Fields to update
   */
  function updateAnnotation(annotationId, updates) {
    if (!isConnected) return false;

    const message = {
      type: 'annotation-updated',
      data: {
        id: annotationId,
        ...updates,
        updatedAt: Date.now()
      }
    };

    socket.send(JSON.stringify(message));
    emitEvent('annotation-updated', {...message.data, from: specialistId});
    return true;
  }

  /**
   * Remove annotation
   * @param {string} annotationId - ID of annotation to remove
   */
  function removeAnnotation(annotationId) {
    if (!isConnected) return false;

    const message = {
      type: 'annotation-removed',
      data: {
        id: annotationId,
        removedAt: Date.now()
      }
    };

    socket.send(JSON.stringify(message));
    emitEvent('annotation-removed', {...message.data, from: specialistId});
    return true;
  }

  /**
   * Add sticky note with decision or observation
   * @param {object} note - {x, y, text, type: 'strategy'|'observation'|'question', color}
   */
  function addNote(note) {
    if (!isConnected) return false;

    const message = {
      type: 'note-added',
      data: {
        id: generateId(),
        ...note,
        createdAt: Date.now()
      }
    };

    socket.send(JSON.stringify(message));
    emitEvent('note-added', {...message.data, from: specialistId});
    console.log('📝 Note added:', note.text.substring(0, 50));
    return true;
  }

  /**
   * Broadcast cursor position to other specialist
   * @param {object} position - {x, y}
   */
  function moveCursor(position) {
    if (!isConnected) return false;

    const message = {
      type: 'cursor-moved',
      data: {
        position,
        specialistId,
        name: localStorage.getItem('specialist-name') || 'Specialist'
      }
    };

    socket.send(JSON.stringify(message));
    return true;
  }

  /**
   * Log a decision made about student response
   * @param {object} decision - {moment, decision, rationale}
   */
  function logDecision(decision) {
    if (!isConnected) return false;

    const message = {
      type: 'decision-logged',
      data: {
        id: generateId(),
        ...decision,
        specialistId,
        loggedAt: Date.now()
      }
    };

    socket.send(JSON.stringify(message));
    emitEvent('decision-logged', {...message.data, from: specialistId});
    console.log('📋 Decision logged:', decision.decision);
    return true;
  }

  /**
   * Send chat message (hidden from student)
   * @param {string} text - Message text
   */
  function sendMessage(text) {
    if (!isConnected) return false;

    const message = {
      type: 'chat-message',
      data: {
        id: generateId(),
        text,
        specialistId,
        name: localStorage.getItem('specialist-name') || 'Specialist',
        sentAt: Date.now()
      }
    };

    socket.send(JSON.stringify(message));
    emitEvent('chat-message', {...message.data, from: specialistId});
    return true;
  }

  /**
   * Get current session status
   */
  function getStatus() {
    return {
      isConnected,
      sessionId,
      specialistId,
      socketState: socket ? socket.readyState : null
    };
  }

  /**
   * Disconnect from session
   */
  function disconnect() {
    if (socket) {
      socket.close();
      socket = null;
      isConnected = false;
      console.log('✓ Disconnected from collaboration session');
    }
  }

  /**
   * Event management
   */
  function on(event, callback) {
    if (!eventListeners[event]) {
      eventListeners[event] = [];
    }
    eventListeners[event].push(callback);
  }

  function off(event, callback) {
    if (eventListeners[event]) {
      eventListeners[event] = eventListeners[event].filter(cb => cb !== callback);
    }
  }

  function emitEvent(event, data) {
    if (eventListeners[event]) {
      eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error in ${event} listener:`, err);
        }
      });
    }
  }

  /**
   * Generate unique ID for annotations/notes
   */
  function generateId() {
    return `${specialistId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  return {
    connect,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    addNote,
    moveCursor,
    logDecision,
    sendMessage,
    getStatus,
    disconnect,
    on,
    off
  };
})();
