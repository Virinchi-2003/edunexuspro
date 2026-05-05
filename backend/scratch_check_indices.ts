import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function checkIndices() {
  const res = await client.execute("SELECT name, tbl_name FROM sqlite_master WHERE type='index';");
  console.log('Existing Indices:', res.rows.map(r => ({ name: r.name, table: r.tbl_name })));
  process.exit(0);
}

checkIndices();
