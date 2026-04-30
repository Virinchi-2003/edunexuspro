import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './backend/src/db/schema';
import dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

dotenv.config({ path: './backend/.env' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client);

async function migrate() {
  console.log('Migrating fees and fee_transactions tables...');

  try {
    // Add breakdown field to fees table
    await client.execute(`ALTER TABLE fees ADD COLUMN breakdown TEXT`); // JSON string
    
    // Add GST details to fee_transactions
    await client.execute(`ALTER TABLE fee_transactions ADD COLUMN gstAmount REAL DEFAULT 0`);
    await client.execute(`ALTER TABLE fee_transactions ADD COLUMN invoiceNumber TEXT`);
    await client.execute(`ALTER TABLE fee_transactions ADD COLUMN paymentMethod TEXT`); // card, upi, etc
    
    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate();
