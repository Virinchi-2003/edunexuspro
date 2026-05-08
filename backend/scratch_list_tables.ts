import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function listTables() {
  try {
    const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables in database:');
    result.rows.forEach(row => console.log(`- ${row.name}`));
  } catch (error) {
    console.error('Error listing tables:', error);
  } finally {
    client.close();
  }
}

listTables();
