import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './src/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client, { schema });

async function debug() {
  console.log('--- Debugging Teacher Leave Requests (Unified Logic) ---');
  
  const jackson = await db.query.staff.findFirst({
    where: (s, { like }) => like(s.name, '%Jackson%')
  });
  
  if (!jackson) {
    console.log('Teacher Jackson not found');
    process.exit(0);
  }
  
  const staffId = jackson.id;
  console.log('Teacher:', jackson.name, 'ID:', staffId);
  console.log('Legacy Classes Field:', jackson.classes);

  // Unified Logic
  const assignments = await db.query.teacherClassAssignments.findMany({ where: eq(schema.teacherClassAssignments.teacherId, staffId) });
  const classIdsFromAssignments = assignments.map(a => a.classId);
  console.log('Class IDs from Assignments:', classIdsFromAssignments);

  const timetableSlotsAll = await db.query.timetableSlots.findMany({
    where: eq(schema.timetableSlots.teacherId, staffId),
    with: { timetable: true }
  });
  const classIdsFromTimetable = timetableSlotsAll.map(s => s.timetable?.classId).filter(Boolean) as string[];
  console.log('Class IDs from Timetable:', classIdsFromTimetable);

  let classIdsFromStaffField: string[] = [];
  if (jackson.classes) {
    let legacyClasses: string[] = [];
    try {
      const parsed = JSON.parse(jackson.classes);
      if (Array.isArray(parsed)) legacyClasses = parsed;
    } catch (e) {
      legacyClasses = jackson.classes.split(',').map(s => s.trim()).filter(s => s);
    }
    
    const allClasses = await db.query.classes.findMany({
      where: eq(schema.classes.schoolId, jackson.schoolId)
    });
    
    for (const a of legacyClasses) {
      const lowerA = a.toLowerCase().trim();
      const cleanA = lowerA.replace(/(\d+)(st|nd|rd|th)/i, '$1').replace(/[\s-]/g, '').replace(/^class/i, '');
      const matched = allClasses.filter(c => {
        const className = c.name.toLowerCase().trim();
        const sectionName = (c.section || '').toLowerCase().trim();
        const cleanClassName = className.replace(/(\d+)(st|nd|rd|th)/i, '$1');
        const cleanC = `${cleanClassName}${sectionName}`.replace(/[\s-]/g, '');
        return c.id === a || cleanA === cleanC || cleanA === cleanClassName || lowerA.includes(cleanC) || cleanA.includes(cleanC);
      });
      classIdsFromStaffField.push(...matched.map(m => m.id));
    }
  }
  console.log('Class IDs from Staff Field:', classIdsFromStaffField);

  const myClassIds = Array.from(new Set([...classIdsFromAssignments, ...classIdsFromTimetable, ...classIdsFromStaffField]));
  console.log('Total Unified Class IDs:', myClassIds);

  const myStudents = await db.query.students.findMany({
    where: inArray(schema.students.classId, myClassIds.length > 0 ? myClassIds : ['none'])
  });
  
  console.log('Total Students taught by Jackson:', myStudents.length);
  const studentIds = myStudents.map(s => s.id);

  const leaves = await db.query.leaveRequests.findMany({
    where: and(
      eq(schema.leaveRequests.schoolId, jackson.schoolId),
      inArray(schema.leaveRequests.studentId, studentIds.length > 0 ? studentIds : ['none'])
    ),
    with: {
      student: true
    }
  });

  console.log('Total Leave Requests visible to Jackson:', leaves.length);
  for (const l of leaves) {
      console.log(`- Request by: ${l.student?.name} | Reason: ${l.reason} | Status: ${l.status}`);
  }

  process.exit(0);
}

debug();
