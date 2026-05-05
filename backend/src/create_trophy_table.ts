import { db } from './config/database';
import { sql } from 'drizzle-orm';

async function createTrophyTable() {
  try {
    console.log('Creating trophies table...');
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS trophies (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        sportId TEXT,
        tournamentName TEXT NOT NULL,
        awardTitle TEXT NOT NULL,
        year TEXT NOT NULL,
        photoURL TEXT,
        description TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schoolId) REFERENCES schools(id),
        FOREIGN KEY (sportId) REFERENCES sports(id)
      )
    `);
    console.log('Trophies table created successfully.');
  } catch (error) {
    console.error('Error creating table:', error);
  }
}

createTrophyTable();
