const { createClient } = require('@libsql/client');
require('dotenv').config({ path: 'c:/EduNexusPro/backend/.env' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log('🚀 Updating attendance table with staffId...');
  try {
    await client.execute("ALTER TABLE attendance ADD COLUMN staffId TEXT");
    await client.execute("ALTER TABLE attendance ADD COLUMN remarks TEXT");
    console.log('✅ Columns added successfully.');
  } catch (error) {
    console.log('ℹ️ Error (likely already exists):', error.message);
  } finally {
    process.exit(0);
  }
}

migrate();
