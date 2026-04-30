import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './src/db/schema';
import dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client, { schema });

async function checkJackson() {
  try {
    console.log('--- Staff Check ---');
    const staffMembers = await db.query.staff.findMany({
      where: (staff, { like }) => like(staff.name, '%Jackson%')
    });
    console.log('Jackson Staff records:', JSON.stringify(staffMembers, null, 2));

    if (staffMembers.length > 0) {
      const jackson = staffMembers[0];
      
      console.log('\n--- Assignments Check ---');
      const assignments = await db.query.teacherClassAssignments.findMany({
        where: eq(schema.teacherClassAssignments.teacherId, jackson.id),
        with: {
          class: true
        }
      });
      console.log('Assignments:', JSON.stringify(assignments, null, 2));

      console.log('\n--- Timetable Check ---');
      const slots = await db.query.timetableSlots.findMany({
        where: eq(schema.timetableSlots.teacherId, jackson.id),
        with: {
          timetable: {
            with: {
              class: true
            }
          }
        }
      });
      console.log('Timetable Slots:', JSON.stringify(slots, null, 2));

      console.log('\n--- Students Check ---');
      const allStudents = await db.query.students.findMany({
          limit: 5
      });
      console.log('Sample Students:', JSON.stringify(allStudents, null, 2));
      
      console.log('\n--- Classes Check ---');
      const allClasses = await db.query.classes.findMany();
      console.log('All Classes:', JSON.stringify(allClasses, null, 2));

      console.log('\n--- Exams Check ---');
      const allExams = await db.query.exams.findMany();
      console.log('All Exams:', JSON.stringify(allExams, null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.close();
  }
}

checkJackson();
