const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    console.log('Creating admissions table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS admissions (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        studentName TEXT NOT NULL,
        parentName TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        grade TEXT NOT NULL,
        address TEXT,
        dateOfBirth TEXT,
        gender TEXT,
        aadhaarNumber TEXT,
        documents TEXT,
        status TEXT DEFAULT 'pending',
        appliedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table created successfully!');
  } catch (error) {
    console.error('❌ Error creating table:', error);
  } finally {
    process.exit(0);
  }
}

run();
