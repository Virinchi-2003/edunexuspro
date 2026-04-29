import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function migrate() {
  console.log('🚀 Starting Exam Classes Migration...');
  
  try {
    console.log('Adding assignedClasses to exams table...');
    await client.execute('ALTER TABLE exams ADD COLUMN assignedClasses TEXT');
  } catch (e: any) {
    if (e.message.includes('duplicate column name')) {
        console.log('assignedClasses already exists in exams');
    } else {
        console.warn('Error adding assignedClasses to exams:', e.message);
    }
  }

  console.log('✅ Migration complete!');
}

migrate().catch(console.error);
