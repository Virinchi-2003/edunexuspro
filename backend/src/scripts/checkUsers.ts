import { db } from '../config/database';
import { users } from '../db/schema';

async function check() {
  try {
    const usersList = await db.select().from(users);
    console.log('--- USERS ---');
    console.log(JSON.stringify(usersList, null, 2));
  } catch (error) {
    console.error('Error querying DB:', error);
  }
}

check();
