const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function check() {
  console.log('--- ALL LEADS ---');
  const leads = await client.execute("SELECT schoolName, email, paymentStatus, status FROM leads");
  console.table(leads.rows);
  
  process.exit(0);
}

check();
