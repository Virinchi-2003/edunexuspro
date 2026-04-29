
import { db } from './src/config/database';
import { staff, teacherClassAssignments, classes, students, attendance } from './src/db/schema';
import { eq, and } from 'drizzle-orm';

async function checkJackson() {
  const teacher = await db.query.staff.findFirst({
    where: eq(staff.name, 'Jackson')
  });

  if (!teacher) {
    console.log('Teacher Jackson not found');
    return;
  }

  console.log('Found Teacher:', teacher);

  const assignments = await db.query.teacherClassAssignments.findMany({
    where: eq(teacherClassAssignments.teacherId, teacher.id),
    with: {
      class: true
    }
  });

  console.log('Assignments:', assignments);

  for (const a of assignments) {
    const studentCount = await db.query.students.findMany({
      where: eq(students.classId, a.classId)
    });
    console.log(`Class ${a.class.name}-${a.class.section} has ${studentCount.length} students`);
  }
}

checkJackson().catch(console.error);
