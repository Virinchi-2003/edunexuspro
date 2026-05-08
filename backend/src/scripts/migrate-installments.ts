import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set');
}

const client = createClient({ url, authToken });

async function migrate() {
  console.log('Running manual migration for fee installments...');

  try {
    // 1. Add installments column to fee_structures
    await client.execute(`ALTER TABLE fee_structures ADD COLUMN installments TEXT;`);
    console.log('Added installments column to fee_structures');
  } catch (e) {
    console.log('Column installments might already exist in fee_structures');
  }

  try {
    // 2. Create fee_installments table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS fee_installments (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        studentId TEXT NOT NULL,
        feeRecordId TEXT,
        installmentNumber INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        dueDate TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        paymentMode TEXT,
        transactionId TEXT,
        paidAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created fee_installments table');
  } catch (e) {
    console.error('Error creating fee_installments table:', e);
  }

  try {
    // 3. Create fee_reminders table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS fee_reminders (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        studentId TEXT NOT NULL,
        installmentId TEXT,
        reminderDate TEXT DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'sent'
      );
    `);
    console.log('Created fee_reminders table');
  } catch (e) {
    console.error('Error creating fee_reminders table:', e);
  }

  console.log('Migration completed successfully!');
  process.exit(0);
}

migrate();
