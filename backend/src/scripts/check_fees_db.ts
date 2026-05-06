import { db } from '../config/database';
import { fees, schools, students } from '../db/schema';
import { count } from 'drizzle-orm';

async function checkFees() {
  const feeCount = await db.select({ value: count() }).from(fees);
  const schoolCount = await db.select({ value: count() }).from(schools);
  const studentCount = await db.select({ value: count() }).from(students);
  
  console.log('Total Fees:', feeCount[0].value);
  console.log('Total Schools:', schoolCount[0].value);
  console.log('Total Students:', studentCount[0].value);
  
  const sampleFees = await db.query.fees.findMany({ limit: 5 });
  console.log('Sample Fees:', JSON.stringify(sampleFees, null, 2));

  process.exit(0);
}

checkFees().catch(console.error);
