import { db } from '../config/database';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Creating measurements table...');
  try {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS measurements (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        studentId TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        height REAL,
        weight REAL,
        bmi REAL,
        fatPercentage REAL,
        muscleMass REAL,
        chest REAL,
        waist REAL,
        recordedBy TEXT REFERENCES staff(id),
        notes TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Measurements table created successfully!');
  } catch (error) {
    console.error('Error creating measurements table:', error);
  }
}

migrate();
