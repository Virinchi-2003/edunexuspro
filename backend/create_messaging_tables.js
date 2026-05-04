const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function createTables() {
  console.log('🚀 Creating Messaging Tables...');
  
  try {
    // Create conversations table
    console.log('Creating conversations table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        participant1 TEXT NOT NULL REFERENCES users(uid),
        participant2 TEXT NOT NULL REFERENCES users(uid),
        lastMessage TEXT,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create messages table
    console.log('Creating messages table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversationId TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        senderId TEXT NOT NULL REFERENCES users(uid),
        content TEXT NOT NULL,
        isRead INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Messaging tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    process.exit(0);
  }
}

createTables();
