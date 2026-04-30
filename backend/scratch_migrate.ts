import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function migrate() {
  console.log('Migrating database...');
  
  try {
    console.log('Creating table if not exists...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        studentId TEXT NOT NULL,
        reason TEXT NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        approvedBy TEXT,
        teacherMessage TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Checked/Created leave_requests table');
    
    // Check if teacherMessage column exists, if not add it
    try {
        await client.execute('ALTER TABLE leave_requests ADD COLUMN teacherMessage TEXT');
        console.log('✅ Added teacherMessage column to leave_requests');
    } catch (e: any) {
        if (e.message.includes('duplicate column name')) {
            console.log('ℹ️ teacherMessage column already exists');
        } else {
            console.log('ℹ️ Note on teacherMessage:', e.message);
        }
    }

  } catch (error) {
    console.error('Migration failed:', error);
  }
  
  process.exit(0);
}

migrate();
