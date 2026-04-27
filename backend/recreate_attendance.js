const { createClient } = require('@libsql/client');
require('dotenv').config({ path: 'c:/EduNexusPro/backend/.env' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log('🚀 Recreating attendance table...');
  try {
    await client.execute("DROP TABLE IF EXISTS attendance");
    await client.execute(`
      CREATE TABLE attendance (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        studentId TEXT,
        staffId TEXT,
        classId TEXT,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        remarks TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ attendance table recreated successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
