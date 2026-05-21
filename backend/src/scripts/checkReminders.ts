import { db } from '../config/database';
import { repaymentReminders, schools } from '../db/schema';

async function check() {
  try {
    const remindersList = await db.select().from(repaymentReminders);
    console.log('--- REPAYMENT REMINDERS ---');
    console.log(JSON.stringify(remindersList, null, 2));

    const schoolsList = await db.select().from(schools);
    console.log('--- SCHOOLS ---');
    console.log(JSON.stringify(schoolsList, null, 2));
  } catch (error) {
    console.error('Error querying DB:', error);
  }
}

check();
