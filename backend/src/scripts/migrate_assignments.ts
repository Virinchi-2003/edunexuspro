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
    console.log('Running teacher assignments migration...');
    
    // Create teacher_class_assignments table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS teacher_class_assignments (
        id TEXT PRIMARY KEY,
        teacherId TEXT NOT NULL,
        classId TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacherId) REFERENCES staff(id) ON DELETE CASCADE,
        FOREIGN KEY (classId) REFERENCES classes(id) ON DELETE CASCADE
      )
    `);
    console.log('Created teacher_class_assignments table.');

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
