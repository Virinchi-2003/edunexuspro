import { db } from './src/config/database';
import { students, fees, users } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function checkFees() {
  console.log('--- Checking Students ---');
  const allStudents = await db.query.students.findMany();
  allStudents.forEach(s => console.log(`Student: ${s.name}, ID: ${s.id}, Roll: ${s.studentId}, School: ${s.schoolId}`));

  console.log('\n--- Checking Users ---');
  const allUsers = await db.query.users.findMany();
  allUsers.forEach(u => console.log(`User: ${u.name}, UID: ${u.uid}, Role: ${u.role}, School: ${u.schoolId}`));

  console.log('\n--- Checking Fees ---');
  const allFees = await db.query.fees.findMany();
  allFees.forEach(f => console.log(`Fee: ${f.feeType}, StudentID: ${f.studentId}, Amount: ${f.amount}, Status: ${f.status}`));
}

checkFees().catch(console.error);
