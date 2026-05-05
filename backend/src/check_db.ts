import { db } from './config/database';
import { trophies, sports } from './db/schema';
import { eq } from 'drizzle-orm';

async function checkTrophies() {
  try {
    const allTrophies = await db.select().from(trophies).all();
    console.log('All Trophies:', JSON.stringify(allTrophies, null, 2));
    
    const allSports = await db.select().from(sports).all();
    console.log('All Sports:', JSON.stringify(allSports, null, 2));
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkTrophies();
