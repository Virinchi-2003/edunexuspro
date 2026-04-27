import { db } from './src/config/database';
import { users, principals } from './src/db/schema';

async function check() {
  console.log('--- USERS ---');
  const allUsers = await db.select().from(users);
  console.table(allUsers);

  console.log('\n--- PRINCIPALS ---');
  const allPrincipals = await db.select().from(principals);
  console.table(allPrincipals);
  
  process.exit(0);
}

check();
