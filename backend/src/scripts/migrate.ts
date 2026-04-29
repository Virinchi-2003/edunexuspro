import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function migrate() {
  try {
    console.log('Running manual migration...');
    
    // Add currentAcademicYear to schools
    try {
      await client.execute('ALTER TABLE schools ADD COLUMN currentAcademicYear TEXT DEFAULT "2026-27"');
      console.log('Added currentAcademicYear to schools table.');
    } catch (e: any) {
      if (e.message.includes('duplicate column name')) {
        console.log('currentAcademicYear already exists in schools.');
      } else {
        throw e;
      }
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
