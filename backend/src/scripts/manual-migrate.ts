import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function migrate() {
  try {
    console.log("Adding columns to fees table...");
    await client.execute("ALTER TABLE fees ADD COLUMN lateFee INTEGER DEFAULT 0");
    await client.execute("ALTER TABLE fees ADD COLUMN gracePeriodDays INTEGER DEFAULT 5");
    await client.execute("ALTER TABLE fees ADD COLUMN challanNumber TEXT");
    console.log("Migration successful!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
