import { db } from './src/config/database';
import { fees } from './src/db/schema';
import { v4 as uuidv4 } from 'uuid';

async function addUnpaidFee() {
  const studentId = '5b1dcd42-8be3-43e9-a0c6-d10955f4006e';
  const schoolId = '5b1dcd42-8be3-43e9-a0c6-d10955f4006e'; // Assuming same based on logs

  await db.insert(fees).values({
    id: uuidv4(),
    schoolId,
    studentId,
    amount: 15000,
    feeType: 'Quarterly Tuition Fee',
    status: 'unpaid',
    dueDate: '2026-06-30',
    academicYear: '2026-27'
  });

  console.log('Successfully added unpaid fee for student');
}

addUnpaidFee().catch(console.error);
