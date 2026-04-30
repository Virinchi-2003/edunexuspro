const { createClient } = require('@libsql/client');
require('dotenv').config({ path: './.env' });

async function check() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('TABLES:', tables.rows.map(r => r.name));

  for (const t of ['fees', 'fee_transactions', 'feeTransactions', 'fee_structures']) {
    const info = await client.execute(`PRAGMA table_info(${t})`);
    console.log(`INFO ${t}:`, info.rows.map(r => r.name));
  }
}

check();
