import { db } from '../config/database';
import { staff, students, timetable, classes } from '../db/schema';
import { eq } from 'drizzle-orm';

async function dumpData() {
  console.log('--- STAFF ---');
  const allStaff = await db.select().from(staff);
  console.log(JSON.stringify(allStaff.map(s => ({ id: s.id, name: s.name, classes: s.classes, userId: s.userId })), null, 2));

  console.log('--- CLASSES ---');
  const allClasses = await db.select().from(classes);
  console.log(JSON.stringify(allClasses.map(c => ({ id: c.id, name: c.name, section: c.section })), null, 2));

  console.log('--- TIMETABLE ---');
  const allTimetable = await db.select().from(timetable);
  // Also get slots if they are in another table?
  // Let's check schema for slots.
  console.log(JSON.stringify(allTimetable, null, 2));
}

dumpData();
