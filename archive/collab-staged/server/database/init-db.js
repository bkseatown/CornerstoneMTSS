/**
 * Database Initialization Module
 * Cornerstone MTSS Collaboration Server
 *
 * Handles database setup for both MongoDB and PostgreSQL
 * Ensures all collections/tables and indexes are created
 */

const mongoose = require('mongoose');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

/**
 * Initialize MongoDB connection and create models
 */
async function initMongoDB(mongoUri) {
  try {
    console.log('🗄️  Connecting to MongoDB...');

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: process.env.DB_POOL_SIZE || 10,
      socketTimeoutMS: 45000
    });

    console.log('✓ MongoDB connected');

    // Import and verify models
    const models = require('./schema-mongodb');

    // Create indexes
    console.log('🔍 Creating indexes...');
    await models.Session.collection.createIndex({ lastActivity: 1 }, { expireAfterSeconds: 86400 });
    await models.AuditLog.collection.createIndex({ timestamp: 1 }, { expireAfterSeconds: 2592000 });
    console.log('✓ Indexes created');

    return models;
  } catch (err) {
    console.error('❌ MongoDB initialization failed:', err);
    throw err;
  }
}

/**
 * Initialize PostgreSQL connection and create schema
 */
async function initPostgreSQL(databaseUrl) {
  try {
    console.log('🗄️  Connecting to PostgreSQL...');

    const pool = new Pool({
      connectionString: databaseUrl,
      max: process.env.DB_POOL_SIZE || 20
    });

    // Test connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✓ PostgreSQL connected:', result.rows[0]);
    client.release();

    // Execute schema creation
    console.log('📋 Creating schema...');
    const schemaPath = path.join(__dirname, 'schema-postgresql.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split by statement and execute
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        await pool.query(statement);
      } catch (err) {
        // Ignore "already exists" errors
        if (!err.message.includes('already exists')) {
          console.warn('⚠️  Schema statement error:', err.message);
        }
      }
    }

    console.log('✓ Schema created/verified');

    return pool;
  } catch (err) {
    console.error('❌ PostgreSQL initialization failed:', err);
    throw err;
  }
}

/**
 * Initialize database based on environment variable
 * DATABASE_URL for PostgreSQL, MONGODB_URI for MongoDB
 */
async function initializeDatabase() {
  const dbType = process.env.DATABASE_URL ? 'postgresql' : 'mongodb';

  try {
    console.log(`\n🗄️  Database Initialization\n${'='.repeat(40)}`);
    console.log(`Type: ${dbType.toUpperCase()}`);

    if (dbType === 'postgresql') {
      const pool = await initPostgreSQL(process.env.DATABASE_URL);
      return {
        type: 'postgresql',
        connection: pool,
        query: (sql, params) => pool.query(sql, params)
      };
    } else {
      const models = await initMongoDB(process.env.MONGODB_URI || 'mongodb://localhost:27017/cornerstone-mtss');
      return {
        type: 'mongodb',
        models: models,
        query: (model, operation) => models[model][operation]
      };
    }
  } catch (err) {
    console.error('Database initialization failed:', err);
    throw err;
  }
}

/**
 * Create sample data for testing
 */
async function createSampleData(db) {
  console.log('\n📊 Creating sample data...');

  try {
    if (db.type === 'mongodb') {
      const { User, StudentProfile, Session } = db.models;

      // Create sample teacher
      const teacher = await User.create({
        userId: 'teacher-001',
        email: 'teacher@example.com',
        name: 'Mrs. Johnson',
        role: 'teacher',
        schoolId: 'school-001',
        isActive: true
      });
      console.log('✓ Sample teacher created');

      // Create sample student
      const student = await StudentProfile.create({
        studentId: 'student-001',
        firstName: 'Emma',
        lastName: 'Smith',
        grade: '2nd',
        schoolId: 'school-001',
        classroomId: 'room-201',
        teacherId: teacher._id,
        interventionTier: 'tier2'
      });
      console.log('✓ Sample student created');

      // Create sample session
      const session = await Session.create({
        sessionId: 'session-001',
        studentId: 'student-001',
        gameType: 'word-quest',
        status: 'ended',
        createdAt: new Date(),
        endedAt: new Date(Date.now() - 3600000)
      });
      console.log('✓ Sample session created');

    } else if (db.type === 'postgresql') {
      // PostgreSQL sample data
      const pool = db.connection;

      // Create sample teacher
      await pool.query(
        'INSERT INTO users (user_id, email, name, role, school_id, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
        ['teacher-001', 'teacher@example.com', 'Mrs. Johnson', 'teacher', 'school-001', true]
      );
      console.log('✓ Sample teacher created');

      // Create sample student
      await pool.query(
        'INSERT INTO student_profiles (student_id, first_name, last_name, grade, school_id, classroom_id, teacher_id, intervention_tier) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        ['student-001', 'Emma', 'Smith', '2nd', 'school-001', 'room-201', 'teacher-001', 'tier2']
      );
      console.log('✓ Sample student created');

      // Create sample session
      await pool.query(
        'INSERT INTO sessions (session_id, student_id, game_type, status, created_at, ended_at) VALUES ($1, $2, $3, $4, $5, $6)',
        ['session-001', 'student-001', 'word-quest', 'ended', new Date(), new Date(Date.now() - 3600000)]
      );
      console.log('✓ Sample session created');
    }
  } catch (err) {
    console.warn('⚠️  Sample data creation skipped (may already exist):', err.message);
  }
}

/**
 * Verify database health
 */
async function verifyDatabase(db) {
  console.log('\n🏥 Verifying database health...');

  try {
    if (db.type === 'mongodb') {
      const { User } = db.models;
      const userCount = await User.countDocuments();
      console.log(`✓ Users table: ${userCount} documents`);

    } else if (db.type === 'postgresql') {
      const pool = db.connection;
      const result = await pool.query('SELECT COUNT(*) FROM users');
      console.log(`✓ Users table: ${result.rows[0].count} rows`);
    }

    console.log('✓ Database health check passed');
  } catch (err) {
    console.error('❌ Database health check failed:', err);
    throw err;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const db = await initializeDatabase();
    await createSampleData(db);
    await verifyDatabase(db);

    console.log('\n✅ Database initialization complete!\n');
    return db;
  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().then(() => process.exit(0));
}

module.exports = { initializeDatabase, initMongoDB, initPostgreSQL, createSampleData, verifyDatabase };
