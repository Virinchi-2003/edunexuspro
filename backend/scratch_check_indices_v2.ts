import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function checkIndices() {
  const res = await client.execute("SELECT name, tbl_name FROM sqlite_master WHERE type='index';");
  res.rows.forEach(r => {
    if (['attendance', 'principals', 'schools', 'users'].includes(r.tbl_name as string)) {
        console.log(`Table: ${r.tbl_name}, Index: ${r.name}`);
    }
  });
  process.exit(0);
}

checkIndices();
