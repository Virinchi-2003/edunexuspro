
import { db } from '../config/database';
import { users } from '../db/schema';

async function checkRoles() {
  const allUsers = await db.query.users.findMany();
  console.log('--- User Roles ---');
  allUsers.forEach(u => {
    console.log(`Email: ${u.email}, Role: "${u.role}"`);
  });
  process.exit(0);
}

checkRoles();
