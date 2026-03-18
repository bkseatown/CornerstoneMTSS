/**
 * MongoDB Schema Definitions
 * Cornerstone MTSS Collaboration Server
 *
 * This file defines the MongoDB schemas for persistent storage of:
 * - Collaboration sessions
 * - Decisions and observations
 * - Annotations (highlights, arrows, notes)
 * - Messages and communications
 * - User profiles and preferences
 */

const mongoose = require('mongoose');

// ============================================================
// Sessions Collection
// ============================================================

const SessionSchema = new mongoose.Schema({
  // Session identifiers
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Context
  studentId: {
    type: String,
    required: true,
    index: true
  },
  gameType: {
    type: String,
    enum: ['typing-quest', 'word-quest', 'reading-lab', 'sentence-surgery', 'writing-studio', 'precision-play', 'paragraph-builder'],
    required: true
  },

  // Participants
  specialists: [{
    specialistId: String,
    name: String,
    role: {
      type: String,
      enum: ['teacher', 'specialist', 'aide'],
      default: 'specialist'
    },
    joinedAt: Date,
    leftAt: Date,
    isActive: Boolean
  }],

  // Session timing
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  startedAt: Date,
  endedAt: Date,
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  duration: Number, // in milliseconds

  // Collaboration data (references)
  annotationIds: [String],
  decisionIds: [String],
  messageIds: [String],

  // Session state
  status: {
    type: String,
    enum: ['active', 'paused', 'ended', 'archived'],
    default: 'active',
    index: true
  },

  // Metadata
  metadata: {
    deviceType: String,
    browsers: [String],
    ipAddresses: [String]
  }
}, {
  timestamps: true,
  collection: 'sessions'
});

SessionSchema.index({ studentId: 1, createdAt: -1 });
SessionSchema.index({ specialistId: 1, createdAt: -1 }); // For specialist queries
SessionSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 86400 }); // TTL: 24 hours

// ============================================================
// Decisions Collection
// ============================================================

const DecisionSchema = new mongoose.Schema({
  // Decision identifiers
  decisionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },

  // Context
  studentId: {
    type: String,
    required: true,
    index: true
  },
  specialistId: {
    type: String,
    required: true,
    index: true
  },
  specialistName: String,

  // Decision details
  decision: {
    type: String,
    enum: ['reteach', 'scaffold', 'intervention', 'advance', 'observe', 'assess', 'pause', 'other'],
    required: true,
    index: true
  },
  rationale: {
    type: String,
    required: true
  },

  // Evidence & documentation
  evidence: {
    studentResponse: String,
    observedBehavior: [String],
    errorPattern: String,
    responseTime: Number, // ms
    accuracy: Number, // 0-100
    confidence: Number, // 0-100
    audioFile: String, // URL to stored audio
    screenshot: String // URL to stored image
  },

  // Contextual information
  targetSkill: String,
  phoneme: String,
  word: String,
  lesson: String,

  // Tags for analytics
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Action items
  followUpActions: [{
    action: String,
    dueDate: Date,
    assignedTo: String,
    completed: Boolean
  }],

  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'decisions'
});

DecisionSchema.index({ studentId: 1, timestamp: -1 });
DecisionSchema.index({ specialistId: 1, timestamp: -1 });
DecisionSchema.index({ decision: 1, timestamp: -1 });
DecisionSchema.index({ studentId: 1, decision: 1, timestamp: -1 });

// ============================================================
// Annotations Collection
// ============================================================

const AnnotationSchema = new mongoose.Schema({
  // Annotation identifiers
  annotationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },

  // Creator
  specialistId: String,
  specialistName: String,

  // Annotation type and data
  type: {
    type: String,
    enum: ['highlight', 'arrow', 'note', 'circle', 'underline'],
    required: true
  },

  // Position and geometry
  position: {
    x: Number,
    y: Number,
    width: Number,
    height: Number
  },
  startPos: { x: Number, y: Number },
  endPos: { x: Number, y: Number },

  // Content
  content: String,
  color: String,
  opacity: Number,

  // Related elements
  wordIndex: Number,
  tileId: String,

  // Lifecycle
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: Date,
  deletedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'annotations'
});

AnnotationSchema.index({ sessionId: 1, createdAt: -1 });
AnnotationSchema.index({ sessionId: 1, type: 1 });

// ============================================================
// Messages Collection
// ============================================================

const MessageSchema = new mongoose.Schema({
  // Message identifiers
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },

  // Sender
  senderId: {
    type: String,
    required: true
  },
  senderName: String,
  senderRole: {
    type: String,
    enum: ['teacher', 'specialist', 'parent', 'student'],
    index: true
  },

  // Content
  text: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['chat', 'annotation', 'decision-note', 'parent-message'],
    default: 'chat'
  },

  // References
  studentId: String,
  inReplyTo: String, // messageId of parent message

  // Attachments
  attachments: [{
    type: String,
    url: String,
    mimeType: String
  }],

  // Metadata
  isArchived: {
    type: Boolean,
    default: false
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },

  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'messages'
});

MessageSchema.index({ sessionId: 1, timestamp: -1 });
MessageSchema.index({ senderId: 1, timestamp: -1 });
MessageSchema.index({ studentId: 1, timestamp: -1 });

// ============================================================
// Users Collection
// ============================================================

const UserSchema = new mongoose.Schema({
  // User identifiers
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Profile
  email: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: String,
  role: {
    type: String,
    enum: ['teacher', 'specialist', 'admin', 'parent'],
    required: true,
    index: true
  },

  // Organization
  schoolId: String,
  gradeLevel: String,
  subjects: [String],

  // Preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    a11yMode: {
      type: String,
      enum: ['standard', 'dyslexia', 'high-contrast', 'low-vision'],
      default: 'standard'
    },
    fontScale: {
      type: Number,
      default: 1.0
    },
    notifications: {
      email: Boolean,
      push: Boolean,
      inApp: Boolean
    }
  },

  // Access control
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  permissions: [String],

  // Verification
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerifiedAt: Date,

  // Password (hashed)
  password: String,
  lastPasswordChange: Date,

  // Session tracking
  lastLogin: Date,
  lastActivity: Date,
  sessionCount: Number,

  // Account management
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  deactivatedAt: Date
}, {
  timestamps: true,
  collection: 'users'
});

UserSchema.index({ email: 1 });
UserSchema.index({ schoolId: 1, role: 1 });
UserSchema.index({ isActive: 1, lastActivity: -1 });

// ============================================================
// Student Profiles Collection
// ============================================================

const StudentProfileSchema = new mongoose.Schema({
  // Student identifiers
  studentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Demographics
  firstName: String,
  lastName: String,
  dateOfBirth: Date,
  grade: String,

  // School context
  schoolId: String,
  classroomId: String,
  teacherId: {
    type: String,
    index: true
  },

  // Intervention eligibility
  hasIEP: Boolean,
  has504Plan: Boolean,
  interventionTier: {
    type: String,
    enum: ['tier1', 'tier2', 'tier3'],
    index: true
  },

  // Progress metrics
  currentLevel: String,
  phonicsPhase: Number,
  sightWords: Number,
  fluencyRate: Number,
  comprehension: Number,

  // Skill tracking
  strengths: [String],
  challenges: [String],
  preferences: [String],

  // Parent information (for FERPA compliance, minimal)
  guardianId: String,
  parentEmail: String,

  // Created date
  enrolledAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  graduatedAt: Date
}, {
  timestamps: true,
  collection: 'student_profiles'
});

StudentProfileSchema.index({ schoolId: 1, classroomId: 1 });
StudentProfileSchema.index({ teacherId: 1 });

// ============================================================
// Analytics & Audit Log Collection
// ============================================================

const AuditLogSchema = new mongoose.Schema({
  // Log identifiers
  logId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Event details
  eventType: {
    type: String,
    enum: ['session_start', 'session_end', 'decision_made', 'annotation_added', 'message_sent', 'user_login', 'export_requested'],
    required: true,
    index: true
  },

  // Actor
  userId: String,
  userRole: String,

  // Subject
  studentId: String,
  sessionId: String,

  // Event data
  action: String,
  changes: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,

  // Status
  success: Boolean,
  errorMessage: String,

  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'audit_logs'
});

AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ studentId: 1, timestamp: -1 });
AuditLogSchema.index({ eventType: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // TTL: 30 days

// ============================================================
// Export Models
// ============================================================

module.exports = {
  Session: mongoose.model('Session', SessionSchema),
  Decision: mongoose.model('Decision', DecisionSchema),
  Annotation: mongoose.model('Annotation', AnnotationSchema),
  Message: mongoose.model('Message', MessageSchema),
  User: mongoose.model('User', UserSchema),
  StudentProfile: mongoose.model('StudentProfile', StudentProfileSchema),
  AuditLog: mongoose.model('AuditLog', AuditLogSchema)
};
