# Database Setup Guide

**Cornerstone MTSS Collaboration Server** — Persistent storage configuration for sessions, decisions, annotations, and user data.

---

## Overview

The collaboration server supports **two database backends**:

- **MongoDB** — Document-based, flexible schema, easier scaling with sharding
- **PostgreSQL** — Relational, structured schema, ACID transactions, traditional deployment

Choose based on your infrastructure and team expertise.

---

## Part 1: MongoDB Setup

### Prerequisites

```bash
# Option 1: Local MongoDB (development)
brew install mongodb-community  # macOS
# OR
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Option 2: MongoDB Atlas (cloud)
# Visit: https://www.mongodb.com/cloud/atlas
```

### Configuration

1. **Update `.env`**:

```bash
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/cornerstone-mtss

# Or Atlas connection (production):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cornerstone-mtss?retryWrites=true&w=majority
```

2. **Install dependencies**:

```bash
npm install mongoose
```

3. **Initialize database**:

```bash
node server/database/init-db.js
```

**Output should show:**
```
✓ MongoDB connected
✓ Indexes created
✓ Sample data created
✓ Database health check passed
```

### Collections Created

| Collection | Purpose | Documents |
|---|---|---|
| `sessions` | Collaboration sessions | session_id, student_id, gameType, participants |
| `decisions` | Specialist decisions | decision, rationale, evidence, tags |
| `annotations` | Game board markups | highlights, arrows, notes, positions |
| `messages` | Real-time communications | text, sender, type (chat/annotation) |
| `users` | Teacher & specialist profiles | email, role, preferences, permissions |
| `student_profiles` | Student metadata | grade, IEP status, progress metrics |
| `audit_logs` | Event tracking (30-day TTL) | event_type, user_id, action, timestamp |

### Indexes for Performance

```javascript
// Session queries
db.sessions.createIndex({ studentId: 1, createdAt: -1 })
db.sessions.createIndex({ lastActivity: 1 }, { expireAfterSeconds: 86400 })

// Decision retrieval
db.decisions.createIndex({ studentId: 1, timestamp: -1 })
db.decisions.createIndex({ decision: 1, timestamp: -1 })

// Message search
db.messages.createIndex({ sessionId: 1, timestamp: -1 })

// Audit logs (auto-delete after 30 days)
db.audit_logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 2592000 })
```

### Backup & Restore

```bash
# Backup all data
mongodump --uri="mongodb://localhost:27017/cornerstone-mtss" \
          --out=./backups/cornerstone-$(date +%Y%m%d)

# Restore from backup
mongorestore --uri="mongodb://localhost:27017/cornerstone-mtss" \
             ./backups/cornerstone-20260317/cornerstone-mtss

# Automated daily backups (add to crontab)
0 2 * * * mongodump --uri="$MONGODB_URI" --out=/backup/mongodb-$(date +\%Y\%m\%d)
```

### Scaling MongoDB

**For 1000+ sessions:**

```bash
# Enable sharding on database
mongosh admin

# Connect to mongo shell
db.adminCommand({ enableSharding: 'cornerstone-mtss' })

# Shard the sessions collection (by studentId)
db.adminCommand({
  shardCollection: 'cornerstone-mtss.sessions',
  key: { studentId: 1, createdAt: -1 }
})
```

---

## Part 2: PostgreSQL Setup

### Prerequisites

```bash
# Option 1: Local PostgreSQL (development)
brew install postgresql  # macOS
initdb /usr/local/var/postgres
pg_ctl -D /usr/local/var/postgres start

# Option 2: Docker
docker run -d \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=cornerstone_mtss \
  -p 5432:5432 \
  postgres:15-alpine

# Option 3: Cloud (AWS RDS, Azure Database, etc.)
```

### Configuration

1. **Create database**:

```bash
createdb cornerstone_mtss

# Or with custom user
createdb -U cornerstone_user cornerstone_mtss
```

2. **Update `.env`**:

```bash
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/cornerstone_mtss

# Or cloud service:
# DATABASE_URL=postgresql://user:password@rds.amazonaws.com:5432/cornerstone_mtss?sslmode=require
```

3. **Install dependencies**:

```bash
npm install pg
```

4. **Initialize schema**:

```bash
psql -U postgres -d cornerstone_mtss -f server/database/schema-postgresql.sql

# Or via Node:
node server/database/init-db.js
```

**Output should show:**
```
✓ PostgreSQL connected
✓ Schema created/verified
✓ Sample data created
✓ Database health check passed
```

### Tables Created

| Table | Purpose | Key Columns |
|---|---|---|
| `users` | Teacher/specialist profiles | user_id, email, role, school_id |
| `student_profiles` | Student metadata | student_id, grade, teacher_id, intervention_tier |
| `sessions` | Collaboration sessions | session_id, student_id, game_type, status |
| `session_participants` | Many-to-many session attendance | session_id, specialist_id |
| `decisions` | Specialist decisions | decision_id, student_id, decision type, evidence |
| `decision_follow_ups` | Action items from decisions | decision_id, action, due_date, assigned_to |
| `annotations` | Game board markups | annotation_id, session_id, type (highlight/arrow/note) |
| `messages` | Real-time communications | message_id, session_id, sender_id, text |
| `message_attachments` | Files attached to messages | message_id, file_url, mime_type |
| `audit_logs` | Event tracking | log_id, event_type, user_id, timestamp |

### Indexes for Performance

30+ indexes automatically created for:

- Session queries by student/specialist/status
- Decision retrieval and filtering
- Message search and sorting
- Audit log queries with 30-day retention
- User and profile lookups

### Views for Analytics

```sql
-- Active sessions with participant count
SELECT * FROM active_sessions;

-- Student progress summary
SELECT * FROM student_summary;

-- Decision breakdown by type
SELECT * FROM decision_summary;
```

### Backup & Restore

```bash
# Full backup
pg_dump cornerstone_mtss > backup-$(date +%Y%m%d).sql

# Restore
psql cornerstone_mtss < backup-20260317.sql

# Automated daily backups (crontab)
0 2 * * * pg_dump $DATABASE_URL | gzip > /backup/cornerstone-$(date +\%Y\%m\%d).sql.gz
```

### Scaling PostgreSQL

**Connection pooling** (for 100+ concurrent users):

```bash
# Using PgBouncer
brew install pgbouncer

# Edit /etc/pgbouncer/pgbouncer.ini
[databases]
cornerstone_mtss = host=localhost port=5432 dbname=cornerstone_mtss

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 5

# Start
pgbouncer -d /etc/pgbouncer/pgbouncer.ini
```

**Replication** (for disaster recovery):

```sql
-- Primary server setup
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET max_wal_senders = 3;
ALTER SYSTEM SET hot_standby = on;
SELECT pg_ctl_reload('primary_server_path', '-HUP');

-- Replica server setup
SELECT pg_basebackup('postgres://primary_host', synchronous_commit='remote_apply');
```

---

## Part 3: Choosing Your Database

### Use MongoDB if:

✅ **Dynamic schema** — Flexibility with document structure
✅ **Easier horizontal scaling** — Built-in sharding
✅ **Rapid prototyping** — Less migrations needed
✅ **Atlas availability** — Don't want to manage infrastructure
✅ **Experienced team** — Already using MongoDB

### Use PostgreSQL if:

✅ **ACID transactions** — Data consistency guarantees
✅ **Complex relationships** — Multiple joins and constraints
✅ **Cost-sensitive** — RDS/managed services cheaper for small scale
✅ **Compliance requirements** — Better audit trail capabilities
✅ **Experienced team** — Already using PostgreSQL

---

## Part 4: Migration Between Databases

### MongoDB → PostgreSQL

```bash
# 1. Export MongoDB data as JSON
mongoexport --db=cornerstone-mtss --collection=sessions \
  --out=sessions.json

# 2. Transform and load into PostgreSQL
node scripts/migrate-mongodb-to-postgresql.js

# 3. Verify data integrity
node scripts/verify-migration.js

# 4. Update .env and restart server
DATABASE_URL=postgresql://...
npm restart
```

### PostgreSQL → MongoDB

```bash
# 1. Export PostgreSQL as JSONL
COPY (SELECT json_agg(row_to_json(sessions)) FROM sessions)
TO '/tmp/sessions.jsonl';

# 2. Import into MongoDB
mongoimport --db=cornerstone-mtss \
  --collection=sessions \
  --file=/tmp/sessions.jsonl

# 3. Verify and restart
npm restart
```

---

## Part 5: Development Workflow

### Local Development (MongoDB)

```bash
# 1. Start local MongoDB
docker run -d -p 27017:27017 mongo

# 2. Initialize schema
npm run db:init

# 3. Seed sample data
npm run db:seed

# 4. Start server
npm run dev
```

### Testing with Different Database

```bash
# Test with PostgreSQL
DATABASE_URL=postgresql://test:test@localhost/cornerstone_test npm test

# Test with MongoDB
MONGODB_URI=mongodb://localhost:27017/cornerstone_test npm test
```

### Environment Variables

```bash
# .env.local
NODE_ENV=development

# Choose ONE:
MONGODB_URI=mongodb://localhost:27017/cornerstone-mtss
# OR
DATABASE_URL=postgresql://user:pass@localhost:5432/cornerstone_mtss

# Common settings
DB_POOL_SIZE=10
SESSION_TIMEOUT=86400000
```

---

## Part 6: Monitoring & Maintenance

### Health Checks

```bash
# Check MongoDB
mongosh "mongodb://localhost:27017/cornerstone-mtss" --eval "db.adminCommand('ping')"

# Check PostgreSQL
psql -U postgres -d cornerstone_mtss -c "SELECT NOW();"

# API health endpoint
curl http://localhost:3000/api/health
```

### Performance Monitoring

```bash
# MongoDB index usage
mongosh "mongodb://localhost:27017/cornerstone-mtss" --eval "db.sessions.aggregate([{$indexStats:{}}])"

# PostgreSQL slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

### Data Cleanup

```bash
# Remove inactive sessions (> 24 hours)
db.sessions.deleteMany({ lastActivity: { $lt: Date.now() - 86400000 } })

# Remove old audit logs (> 30 days)
DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '30 days';
```

---

## Part 7: Production Deployment

### Managed Services

**MongoDB Atlas** (Recommended for production):
- Auto-scaling
- Automated backups
- Global distribution
- HIPAA compliance available
- [Setup guide](https://docs.atlas.mongodb.com/getting-started/)

**AWS RDS PostgreSQL**:
- Multi-AZ failover
- Automated backups
- Read replicas for scaling
- [Setup guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)

### Connection Security

```bash
# MongoDB with authentication
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/cornerstone-mtss?authSource=admin&retryWrites=true

# PostgreSQL with SSL
DATABASE_URL=postgresql://user:password@host:5432/cornerstone_mtss?sslmode=require

# IP Whitelisting
# MongoDB Atlas: Set IP whitelist in Security > IP Access List
# AWS RDS: Create security group with specific IPs
```

### Environment Variables (Production)

Create `.env.production` with:

```bash
# Database
MONGODB_URI=mongodb+srv://prod-user:***@prod-cluster.mongodb.net/cornerstone-mtss
# OR
DATABASE_URL=postgresql://prod-user:***@prod-rds.amazonaws.com:5432/cornerstone_mtss?sslmode=require

# Connection pooling
DB_POOL_SIZE=20

# Performance
SLOW_QUERY_THRESHOLD=1000

# Backups
BACKUPS_ENABLED=true
BACKUP_FREQUENCY=daily
```

### Verification Checklist

- [ ] Database connection established
- [ ] All tables/collections created
- [ ] Indexes created (verify with admin tools)
- [ ] Sample data visible
- [ ] Health check endpoint returns 200
- [ ] Connection pool working (check logs)
- [ ] Backups scheduled and tested
- [ ] Monitoring alerts configured
- [ ] Slow query logging enabled

---

## Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [AWS RDS](https://aws.amazon.com/rds/)
- [Database Design for Learning Analytics](https://www.ed.ac.uk/institute-academic-development/learning-analytics)
