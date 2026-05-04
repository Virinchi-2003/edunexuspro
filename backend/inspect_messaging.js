const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function inspectTables() {
  console.log('🔍 Inspecting Messaging Tables...');
  
  try {
    const convs = await client.execute("SELECT * FROM conversations");
    console.log(`Conversations Count: ${convs.rows.length}`);
    console.table(convs.rows);

    const msgs = await client.execute("SELECT * FROM messages");
    console.log(`Messages Count: ${msgs.rows.length}`);
    console.table(msgs.rows);
  } catch (error) {
    console.error('❌ Error inspecting tables:', error);
  } finally {
    process.exit(0);
  }
}

inspectTables();
