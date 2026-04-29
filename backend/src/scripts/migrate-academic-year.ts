import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function migrate() {
  console.log('🚀 Starting Academic Year Migration...');
  
  try {
    // Add academicYear to fees
    console.log('Adding academicYear to fees table...');
    await client.execute('ALTER TABLE fees ADD COLUMN academicYear TEXT DEFAULT "2026-27"');
  } catch (e: any) {
    if (e.message.includes('duplicate column name')) {
        console.log('academicYear already exists in fees');
    } else {
        console.warn('Error adding academicYear to fees:', e.message);
    }
  }

  try {
    // Add academicYear to attendance
    console.log('Adding academicYear to attendance table...');
    await client.execute('ALTER TABLE attendance ADD COLUMN academicYear TEXT DEFAULT "2026-27"');
  } catch (e: any) {
    if (e.message.includes('duplicate column name')) {
        console.log('academicYear already exists in attendance');
    } else {
        console.warn('Error adding academicYear to attendance:', e.message);
    }
  }

  console.log('✅ Migration complete!');
}

migrate().catch(console.error);
