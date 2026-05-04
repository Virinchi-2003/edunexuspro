const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function updateTables() {
  console.log('🚀 Updating Messaging Tables with File Support...');
  
  try {
    // Add fileUrl and fileType to messages table
    console.log('Adding fileUrl and fileType columns...');
    
    // LibSQL (SQLite) doesn't support adding multiple columns in one ALTER TABLE
    try {
      await client.execute(`ALTER TABLE messages ADD COLUMN fileUrl TEXT`);
    } catch (e) {
      console.log('fileUrl column might already exist');
    }

    try {
      await client.execute(`ALTER TABLE messages ADD COLUMN fileType TEXT`);
    } catch (e) {
      console.log('fileType column might already exist');
    }

    console.log('✅ Messaging tables updated successfully!');
  } catch (error) {
    console.error('❌ Error updating tables:', error);
  } finally {
    process.exit(0);
  }
}

updateTables();
