-- PostgreSQL Schema for Cornerstone MTSS
-- Collaboration Server: Sessions, Decisions, Annotations, Messages, Users
-- Designed for FERPA compliance and performance
--
-- Usage:
-- psql -U postgres -d cornerstone_mtss -f schema-postgresql.sql

-- ============================================================
-- Enable Extensions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Users Table
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('teacher', 'specialist', 'admin', 'parent')),
  school_id VARCHAR(255),
  grade_level VARCHAR(50),
  subjects TEXT[],

  -- Preferences
  theme VARCHAR(20) DEFAULT 'light',
  a11y_mode VARCHAR(50) DEFAULT 'standard',
  font_scale DECIMAL(3,1) DEFAULT 1.0,

  -- Access control
  is_active BOOLEAN DEFAULT TRUE,
  permissions TEXT[],

  -- Verification
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,

  -- Password (hashed with bcrypt)
  password_hash VARCHAR(255),
  last_password_change TIMESTAMP,

  -- Session tracking
  last_login TIMESTAMP,
  last_activity TIMESTAMP,
  session_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deactivated_at TIMESTAMP,

  -- Indexes
  CONSTRAINT email_lowercase CHECK (email = LOWER(email))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_school_role ON users(school_id, role);
CREATE INDEX idx_users_is_active_last_activity ON users(is_active, last_activity DESC);

-- ============================================================
-- Student Profiles Table
-- ============================================================

CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  date_of_birth DATE,
  grade VARCHAR(50),
  school_id VARCHAR(255),
  classroom_id VARCHAR(255),
  teacher_id VARCHAR(255),

  -- Intervention eligibility
  has_iep BOOLEAN DEFAULT FALSE,
  has_504_plan BOOLEAN DEFAULT FALSE,
  intervention_tier VARCHAR(50) CHECK (intervention_tier IN ('tier1', 'tier2', 'tier3')),

  -- Progress metrics
  current_level VARCHAR(255),
  phonics_phase INTEGER,
  sight_words INTEGER,
  fluency_rate DECIMAL(5,1),
  comprehension DECIMAL(5,1),

  -- Skills
  strengths TEXT[],
  challenges TEXT[],
  preferences TEXT[],

  -- Parent information (FERPA compliant - minimal)
  guardian_id VARCHAR(255),
  parent_email VARCHAR(255),

  -- Timestamps
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  graduated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_profiles_student_id ON student_profiles(student_id);
CREATE INDEX idx_student_profiles_school_classroom ON student_profiles(school_id, classroom_id);
CREATE INDEX idx_student_profiles_teacher_id ON student_profiles(teacher_id);
CREATE INDEX idx_student_profiles_intervention_tier ON student_profiles(intervention_tier);

-- ============================================================
-- Sessions Table
-- ============================================================

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255) NOT NULL UNIQUE,
  student_id VARCHAR(255) NOT NULL,
  game_type VARCHAR(100) NOT NULL CHECK (game_type IN (
    'typing-quest', 'word-quest', 'reading-lab', 'sentence-surgery',
    'writing-studio', 'precision-play', 'paragraph-builder'
  )),

  -- Session state
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended', 'archived')),

  -- Timing
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration_ms INTEGER,

  -- Metadata
  device_type VARCHAR(100),
  browsers TEXT[],
  ip_addresses TEXT[],

  -- Counts (for analytics)
  annotation_count INTEGER DEFAULT 0,
  decision_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0
);

CREATE INDEX idx_sessions_session_id ON sessions(session_id);
CREATE INDEX idx_sessions_student_id ON sessions(student_id);
CREATE INDEX idx_sessions_student_created ON sessions(student_id, created_at DESC);
CREATE INDEX idx_sessions_status_last_activity ON sessions(status, last_activity DESC);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity) WHERE status = 'active';

-- ============================================================
-- Session Participants (Many-to-Many)
-- ============================================================

CREATE TABLE IF NOT EXISTS session_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255) NOT NULL REFERENCES sessions(session_id),
  specialist_id VARCHAR(255) NOT NULL,
  specialist_name VARCHAR(255),
  role VARCHAR(50) CHECK (role IN ('teacher', 'specialist', 'aide')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,

  UNIQUE(session_id, specialist_id)
);

CREATE INDEX idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX idx_session_participants_specialist_id ON session_participants(specialist_id);

-- ============================================================
-- Decisions Table
-- ============================================================

CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id VARCHAR(255) NOT NULL UNIQUE,
  session_id VARCHAR(255) NOT NULL REFERENCES sessions(session_id),
  student_id VARCHAR(255) NOT NULL,
  specialist_id VARCHAR(255) NOT NULL,
  specialist_name VARCHAR(255),

  -- Decision details
  decision VARCHAR(100) NOT NULL CHECK (decision IN (
    'reteach', 'scaffold', 'intervention', 'advance', 'observe', 'assess', 'pause', 'other'
  )),
  rationale TEXT NOT NULL,

  -- Evidence
  student_response TEXT,
  observed_behavior TEXT[],
  error_pattern TEXT,
  response_time_ms INTEGER,
  accuracy_pct DECIMAL(3,1),
  confidence_pct DECIMAL(3,1),
  audio_file VARCHAR(255),
  screenshot_file VARCHAR(255),

  -- Context
  target_skill VARCHAR(255),
  phoneme VARCHAR(50),
  word VARCHAR(255),
  lesson VARCHAR(255),

  -- Organization
  tags TEXT[],
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Timestamps
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_decisions_decision_id ON decisions(decision_id);
CREATE INDEX idx_decisions_session_id ON decisions(session_id);
CREATE INDEX idx_decisions_student_id ON decisions(student_id);
CREATE INDEX idx_decisions_specialist_id ON decisions(specialist_id);
CREATE INDEX idx_decisions_student_timestamp ON decisions(student_id, timestamp DESC);
CREATE INDEX idx_decisions_specialist_timestamp ON decisions(specialist_id, timestamp DESC);
CREATE INDEX idx_decisions_decision_type ON decisions(decision, timestamp DESC);

-- ============================================================
-- Decision Follow-up Actions (One-to-Many)
-- ============================================================

CREATE TABLE IF NOT EXISTS decision_follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id VARCHAR(255) NOT NULL REFERENCES decisions(decision_id),
  action VARCHAR(255) NOT NULL,
  due_date DATE,
  assigned_to VARCHAR(255),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_decision_follow_ups_decision_id ON decision_follow_ups(decision_id);
CREATE INDEX idx_decision_follow_ups_assigned_to ON decision_follow_ups(assigned_to, completed);

-- ============================================================
-- Annotations Table
-- ============================================================

CREATE TABLE IF NOT EXISTS annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  annotation_id VARCHAR(255) NOT NULL UNIQUE,
  session_id VARCHAR(255) NOT NULL REFERENCES sessions(session_id),
  specialist_id VARCHAR(255),
  specialist_name VARCHAR(255),

  -- Type and geometry
  type VARCHAR(100) NOT NULL CHECK (type IN ('highlight', 'arrow', 'note', 'circle', 'underline')),
  position_x INTEGER,
  position_y INTEGER,
  position_width INTEGER,
  position_height INTEGER,
  start_x INTEGER,
  start_y INTEGER,
  end_x INTEGER,
  end_y INTEGER,

  -- Content
  content TEXT,
  color VARCHAR(20),
  opacity DECIMAL(3,2),

  -- References
  word_index INTEGER,
  tile_id VARCHAR(255),

  -- Lifecycle
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_annotations_annotation_id ON annotations(annotation_id);
CREATE INDEX idx_annotations_session_id ON annotations(session_id);
CREATE INDEX idx_annotations_session_type ON annotations(session_id, type);
CREATE INDEX idx_annotations_is_deleted ON annotations(is_deleted) WHERE is_deleted = FALSE;

-- ============================================================
-- Messages Table
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id VARCHAR(255) NOT NULL UNIQUE,
  session_id VARCHAR(255) NOT NULL REFERENCES sessions(session_id),
  sender_id VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255),
  sender_role VARCHAR(50) CHECK (sender_role IN ('teacher', 'specialist', 'parent', 'student')),

  -- Content
  text TEXT NOT NULL,
  message_type VARCHAR(100) DEFAULT 'chat' CHECK (message_type IN ('chat', 'annotation', 'decision-note', 'parent-message')),

  -- References
  student_id VARCHAR(255),
  in_reply_to VARCHAR(255),

  -- Metadata
  is_archived BOOLEAN DEFAULT FALSE,
  is_anonymous BOOLEAN DEFAULT FALSE,

  -- Timestamps
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_message_id ON messages(message_id);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_session_timestamp ON messages(session_id, timestamp DESC);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_student_id ON messages(student_id);
CREATE INDEX idx_messages_sender_role ON messages(sender_role);

-- ============================================================
-- Message Attachments (One-to-Many)
-- ============================================================

CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id VARCHAR(255) NOT NULL REFERENCES messages(message_id),
  file_url VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_message_attachments_message_id ON message_attachments(message_id);

-- ============================================================
-- Audit Log Table
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL CHECK (event_type IN (
    'session_start', 'session_end', 'decision_made', 'annotation_added',
    'message_sent', 'user_login', 'export_requested'
  )),
  user_id VARCHAR(255),
  user_role VARCHAR(50),
  student_id VARCHAR(255),
  session_id VARCHAR(255),

  -- Event details
  action VARCHAR(255),
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Status
  success BOOLEAN,
  error_message TEXT,

  -- Timestamps
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_log_id ON audit_logs(log_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_student_id ON audit_logs(student_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_timestamp_event ON audit_logs(timestamp DESC, event_type);

-- Set retention policy for audit logs (30 days)
-- Note: This requires pg_partman extension
-- SELECT create_parent('public.audit_logs', 'timestamp', 'native', 'monthly');

-- ============================================================
-- Views for Common Queries
-- ============================================================

-- Active sessions view
CREATE OR REPLACE VIEW active_sessions AS
SELECT
  s.session_id,
  s.student_id,
  s.game_type,
  s.started_at,
  s.last_activity,
  COUNT(DISTINCT sp.specialist_id) as specialist_count,
  COUNT(DISTINCT d.id) as decision_count,
  COUNT(DISTINCT a.id) as annotation_count,
  COUNT(DISTINCT m.id) as message_count
FROM sessions s
LEFT JOIN session_participants sp ON s.session_id = sp.session_id AND sp.is_active = TRUE
LEFT JOIN decisions d ON s.session_id = d.session_id
LEFT JOIN annotations a ON s.session_id = a.session_id AND a.is_deleted = FALSE
LEFT JOIN messages m ON s.session_id = m.session_id
WHERE s.status = 'active'
GROUP BY s.id, s.session_id, s.student_id, s.game_type, s.started_at, s.last_activity;

-- Student summary view
CREATE OR REPLACE VIEW student_summary AS
SELECT
  sp.student_id,
  sp.first_name,
  sp.last_name,
  sp.grade,
  sp.current_level,
  COUNT(DISTINCT s.session_id) as total_sessions,
  COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.session_id END) as active_sessions,
  COUNT(DISTINCT d.id) as total_decisions,
  MAX(s.last_activity) as last_session_activity,
  sp.updated_at
FROM student_profiles sp
LEFT JOIN sessions s ON sp.student_id = s.student_id
LEFT JOIN decisions d ON s.session_id = d.session_id
GROUP BY sp.id, sp.student_id, sp.first_name, sp.last_name, sp.grade, sp.current_level, sp.updated_at;

-- Decision summary by type
CREATE OR REPLACE VIEW decision_summary AS
SELECT
  student_id,
  decision,
  COUNT(*) as count,
  AVG(accuracy_pct) as avg_accuracy,
  AVG(response_time_ms) as avg_response_time,
  DATE_TRUNC('day', timestamp) as day
FROM decisions
GROUP BY student_id, decision, DATE_TRUNC('day', timestamp);

-- ============================================================
-- Functions for Common Operations
-- ============================================================

-- Function: Update last_activity timestamp
CREATE OR REPLACE FUNCTION update_session_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sessions
  SET last_activity = CURRENT_TIMESTAMP
  WHERE session_id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating last_activity
CREATE TRIGGER decision_update_session_last_activity
AFTER INSERT ON decisions
FOR EACH ROW
EXECUTE FUNCTION update_session_last_activity();

CREATE TRIGGER annotation_update_session_last_activity
AFTER INSERT ON annotations
FOR EACH ROW
EXECUTE FUNCTION update_session_last_activity();

CREATE TRIGGER message_update_session_last_activity
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_session_last_activity();

-- ============================================================
-- Initial Indexes Summary
-- ============================================================
-- Total indexes created: 30+
-- Performance optimizations for:
-- - Session queries by student/specialist
-- - Decision retrieval and filtering
-- - Message search and sorting
-- - Audit log queries
-- - User and profile lookups
