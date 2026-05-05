import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const db = drizzle(client, { schema });
export const turso = client; // Keep for legacy raw queries if needed

export const initDb = async () => {
  try {
    console.log('🔄 Checking Database Schema Sync...');
    // In a real production environment, you'd use migrations.
    // For "autosync", drizzle-kit push is used during development.
    // Here we just ensure the client is connected.
    await client.execute('SELECT 1');
    
    // Self-healing: Ensure requisitions table exists
    await client.execute(`
      CREATE TABLE IF NOT EXISTS requisitions (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        itemName TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        priority TEXT DEFAULT 'medium',
        reason TEXT,
        status TEXT DEFAULT 'pending',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Turso Database Connected & Ready.');
  } catch (error) {
    console.error('❌ Failed to connect to Turso Database:', error);
  }
};
