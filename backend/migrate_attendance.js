const { createClient } = require('@libsql/client');
require('dotenv').config({ path: 'c:/EduNexusPro/backend/.env' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log('🚀 Running manual migration for attendance table...');
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        studentId TEXT NOT NULL,
        classId TEXT,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ attendance table created successfully.');

    // Also ensure users table has the new preference columns if not already there
    const cols = ['emailAlerts', 'smsAlerts', 'darkMode', 'language'];
    for (const col of cols) {
      try {
        if (col === 'language') {
           await client.execute("ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'English'");
        } else {
           await client.execute("ALTER TABLE users ADD COLUMN " + col + " INTEGER DEFAULT 0");
        }
        console.log("✅ Added column " + col + " to users table.");
      } catch (e) {
        console.log("ℹ️ Column " + col + " probably already exists or error: " + e.message);
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
