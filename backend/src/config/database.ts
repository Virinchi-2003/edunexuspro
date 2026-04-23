import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

export const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const initDb = async () => {
  try {
    console.log('Initializing Turso Database...');
    
    // Create Schools Table
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS schools (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        contactEmail TEXT NOT NULL,
        subscriptionPlan TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Users Table (for future auth sync)
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        schoolId TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Turso Database Initialized.');
  } catch (error) {
    console.error('❌ Failed to initialize Turso Database:', error);
  }
};
