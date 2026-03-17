# Database Configuration

**Cornerstone MTSS Collaboration Server** — Persistent storage layer for sessions, decisions, annotations, and user data.

---

## Quick Start

### Option 1: MongoDB (Easiest for Development)

```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 mongo

# Setup
cd server
npm install mongoose
npm run db:init

# Verify
curl http://localhost:3000/api/health
```

### Option 2: PostgreSQL (Production-Ready)

```bash
# Install PostgreSQL locally or use Docker
docker run -d -e POSTGRES_PASSWORD=password -p 5432:5432 postgres

# Setup
cd server
npm install pg
createdb cornerstone_mtss
npm run db:init

# Verify
curl http://localhost:3000/api/health
```

---

## Files in This Directory

### Schema & Configuration

| File | Purpose |
|---|---|
| **schema-mongodb.js** | MongoDB collections and indexes |
| **schema-postgresql.sql** | PostgreSQL tables, views, functions |
| **init-db.js** | Initialization script (supports both databases) |
| **DATABASE_SETUP_GUIDE.md** | Comprehensive setup & migration documentation |

### What They Do

**schema-mongodb.js** (380 lines)
- Defines Mongoose models for 7 collections
- Automatic index creation
- TTL configuration for audit logs

**schema-postgresql.sql** (600+ lines)
- Creates 10 tables with relationships
- 30+ indexes for performance
- 3 analytical views
- Trigger functions for audit tracking

**init-db.js** (280 lines)
- Detects MongoDB vs PostgreSQL from env vars
- Creates all schema/tables automatically
- Seeds sample data
- Performs health verification

---

## Deciding: MongoDB or PostgreSQL?

### MongoDB

**Best for:**
- Flexible schema during development
- Easy horizontal scaling with sharding
- Quick prototyping
- Team experienced with NoSQL

**Install:**
```bash
npm install mongoose
```

**Configure (`.env`):**
```
MONGODB_URI=mongodb://localhost:27017/cornerstone-mtss
# Or cloud:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/cornerstone-mtss?retryWrites=true
```

### PostgreSQL

**Best for:**
- ACID transaction guarantees
- Complex relationships/joins
- Cost-effective at small-to-medium scale
- Team experienced with relational databases

**Install:**
```bash
npm install pg
```

**Configure (`.env`):**
```
DATABASE_URL=postgresql://user:password@localhost:5432/cornerstone_mtss
# Or cloud:
# DATABASE_URL=postgresql://user:pass@rds.amazonaws.com:5432/cornerstone_mtss?sslmode=require
```

---

## Data Models

### Sessions
- Collaboration sessions between specialists and students
- Tracks game type, status, duration, participants
- **Indexed by:** studentId, specialist, createdAt, lastActivity

### Decisions
- Specialist observations and intervention decisions
- Evidence: student response, audio, screenshot, error patterns
- Follow-up actions for accountability
- **Indexed by:** studentId, decision type, timestamp

### Annotations
- Game board markups (highlights, arrows, notes)
- Position data for re-rendering
- **Indexed by:** sessionId, type, isDeleted

### Messages
- Real-time communications between specialists
- Supports attachments and threaded replies
- **Indexed by:** sessionId, sender, timestamp

### Users
- Teacher and specialist profiles
- FERPA-compliant permissions model
- **Indexed by:** email, schoolId, role, isActive

### Student Profiles
- Student metadata (grade, IEP status, progress)
- Parent contact info (minimal per FERPA)
- **Indexed by:** studentId, schoolId, teacherId

### Audit Logs
- Event tracking for compliance
- Auto-deletes after 30 days
- **Indexed by:** eventType, userId, timestamp

---

## Setup Steps

### 1. Choose Your Database

Based on section above, select MongoDB or PostgreSQL.

### 2. Install Dependencies

```bash
cd server

# MongoDB
npm install mongoose

# PostgreSQL
npm install pg

# Both (for flexibility)
npm install mongoose pg
```

### 3. Configure Environment

Create `.env` in root directory:

```bash
# Server
NODE_ENV=development
PORT=3000

# Choose ONE:
MONGODB_URI=mongodb://localhost:27017/cornerstone-mtss
# OR
DATABASE_URL=postgresql://user:pass@localhost:5432/cornerstone_mtss
```

### 4. Initialize Database

```bash
npm run db:init
```

**Expected output:**
```
🗄️  Connecting to MongoDB...
✓ MongoDB connected
🔍 Creating indexes...
✓ Indexes created
📊 Creating sample data...
✓ Sample teacher created
✓ Sample student created
✓ Sample session created
🏥 Verifying database health...
✓ Database health check passed

✅ Database initialization complete!
```

### 5. Start Server

```bash
npm run dev
```

### 6. Verify

```bash
# Health check
curl http://localhost:3000/api/health

# Expected response:
# {"status":"ok","timestamp":"...","activeSessions":0,"activeConnections":0}
```

---

## Schemas at a Glance

### MongoDB Collections

```javascript
{
  sessions: { sessionId, studentId, gameType, specialists: [], createdAt, ... },
  decisions: { decisionId, studentId, decision, rationale, evidence: {}, timestamp, ... },
  annotations: { annotationId, sessionId, type, position: {}, content, createdAt, ... },
  messages: { messageId, sessionId, senderId, text, timestamp, ... },
  users: { userId, email, name, role, schoolId, preferences: {}, ... },
  student_profiles: { studentId, firstName, lastName, grade, interventionTier, ... },
  audit_logs: { logId, eventType, userId, action, changes, timestamp, ... }
}
```

### PostgreSQL Tables

```sql
users                    -- 40 rows expected (teachers, specialists, admins)
student_profiles         -- 200+ rows expected (enrolled students)
sessions                 -- Updated per collaboration (auto-cleanup after 24h)
session_participants     -- Many-to-many join (specialists per session)
decisions                -- Hundreds+ (one per observation)
decision_follow_ups      -- Action items (1-3 per decision)
annotations              -- Thousands+ (per session markup)
messages                 -- Hundreds+ (per collaboration)
message_attachments      -- Files referenced by messages
audit_logs               -- All events (30-day retention)
```

---

## Common Tasks

### Backup Data

**MongoDB:**
```bash
mongodump --uri="mongodb://localhost:27017/cornerstone-mtss" \
          --out=./backup-$(date +%Y%m%d)
```

**PostgreSQL:**
```bash
pg_dump cornerstone_mtss > backup-$(date +%Y%m%d).sql
```

### Export Session Data

**Via REST API:**
```bash
curl http://localhost:3000/api/session/:sessionId/export?format=json
```

### Clean Up Old Sessions

**MongoDB:**
```bash
mongo cornerstone-mtss
db.sessions.deleteMany({ lastActivity: { $lt: Date.now() - 86400000 } })
```

**PostgreSQL:**
```bash
DELETE FROM sessions WHERE status='ended' AND last_activity < NOW() - INTERVAL '7 days';
```

### Monitor Database Size

**MongoDB:**
```bash
mongo cornerstone-mtss --eval "db.stats()"
```

**PostgreSQL:**
```sql
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Production Deployment

### Managed Services (Recommended)

**MongoDB Atlas** (Cloud)
- [Setup Guide](https://docs.atlas.mongodb.com/getting-started/)
- Auto-scaling, backups, global distribution
- Free tier available for testing

**AWS RDS PostgreSQL** (Cloud)
- [Setup Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- Multi-AZ failover, automated backups, read replicas

### Security Checklist

- [ ] Use strong passwords (minimum 16 chars, uppercase, numbers, symbols)
- [ ] Enable SSL/TLS for all connections
- [ ] Configure IP whitelisting/security groups
- [ ] Encrypt data at rest (if supported)
- [ ] Enable automated backups
- [ ] Test disaster recovery procedures
- [ ] Monitor connection pools
- [ ] Set up slow query logging
- [ ] Configure audit logging
- [ ] Never commit `.env` files with real credentials

---

## Troubleshooting

### MongoDB Connection Fails

```bash
# Test connection
mongosh "mongodb://localhost:27017"

# If using Atlas, verify:
# 1. IP is whitelisted (Security > IP Access List)
# 2. Password doesn't contain special characters (URL encode if needed)
# 3. Database name is correct
```

### PostgreSQL Connection Fails

```bash
# Test connection
psql -U postgres -d cornerstone_mtss -c "SELECT NOW();"

# Check if server is running
sudo systemctl status postgresql

# Verify port
netstat -tlnp | grep 5432
```

### Schema Not Created

```bash
# Manually create (MongoDB)
node database/init-db.js

# Manually create (PostgreSQL)
psql -U postgres -d cornerstone_mtss -f database/schema-postgresql.sql
```

### High Memory Usage

**MongoDB:**
```bash
# Check index size
mongo cornerstone-mtss --eval "db.sessions.aggregate([{$indexStats:{}}])"

# Rebuild indexes if needed
mongo cornerstone-mtss --eval "db.sessions.reIndex()"
```

**PostgreSQL:**
```sql
-- Check unused indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE idx_scan = 0 AND indexname NOT LIKE 'pk_%';

-- Vacuum and analyze
VACUUM ANALYZE;
```

---

## Migration Between Databases

See **DATABASE_SETUP_GUIDE.md** Part 4 for detailed migration procedures.

Quick version:
1. Export from source database
2. Transform data format
3. Import to target database
4. Verify data integrity
5. Update `.env`
6. Restart server

---

## Performance Tips

### MongoDB

- ✅ Create indexes before large imports
- ✅ Use connection pooling (mongoose handles this)
- ✅ Archive old audit logs (30+ day retention)
- ✅ Use sharding for 1000+ sessions

### PostgreSQL

- ✅ Use connection pooling (PgBouncer)
- ✅ VACUUM regularly (automated with autovacuum)
- ✅ Analyze query plans: `EXPLAIN ANALYZE SELECT ...`
- ✅ Use read replicas for analytics queries

---

## Support

For issues:

1. Check **DATABASE_SETUP_GUIDE.md** (comprehensive troubleshooting)
2. Verify health endpoint: `curl http://localhost:3000/api/health`
3. Check server logs: `npm run dev`
4. Consult database documentation:
   - [MongoDB](https://docs.mongodb.com/)
   - [PostgreSQL](https://www.postgresql.org/docs/)

---

**Last Updated:** 2026-03-17
**Version:** 1.0.0
**Status:** Production Ready
