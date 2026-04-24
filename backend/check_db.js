const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function check() {
  console.log('--- SCHOOLS ---');
  const schools = await client.execute('SELECT id, name, subscriptionPlan FROM schools');
  console.table(schools.rows);

  console.log('\n--- LEADS (PAID but not CONVERTED) ---');
  const leads = await client.execute("SELECT id, schoolName, paymentStatus, status FROM leads WHERE paymentStatus = 'paid' AND status != 'converted'");
  console.table(leads.rows);
  
  process.exit(0);
}

check();
