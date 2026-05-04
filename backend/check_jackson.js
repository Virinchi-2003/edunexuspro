const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function checkTeacher() {
  console.log('🔍 Checking Teacher UID...');
  const res = await client.execute("SELECT uid, name, email, role FROM users WHERE name LIKE '%Jackson%'");
  console.table(res.rows);
  process.exit(0);
}

checkTeacher();
