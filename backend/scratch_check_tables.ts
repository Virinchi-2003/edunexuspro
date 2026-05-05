import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function checkTables() {
  const res = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
  console.log('Existing Tables:', res.rows.map(r => r.name));
  process.exit(0);
}

checkTables();
