const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function inspectStudentData() {
  console.log('🔍 Inspecting Student Dashboard Data...');
  
  // Get student "Student3"
  const studentRes = await client.execute("SELECT id, name, classId, schoolId FROM students WHERE name = 'Student3'");
  if (studentRes.rows.length === 0) {
    console.error('Student3 not found');
    process.exit(1);
  }
  const student = studentRes.rows[0];
  console.log('Student Profile:', student);

  // Check Class
  const classRes = await client.execute({
    sql: "SELECT id, name, section FROM classes WHERE id = ?",
    args: [student.classId]
  });
  console.log('Class Details:', classRes.rows[0]);

  // Check Homework for this class
  const hwRes = await client.execute({
    sql: "SELECT id, title, classId FROM homework WHERE classId = ?",
    args: [student.classId]
  });
  console.log('Homework for Class:', hwRes.rows);

  // Check Submissions for this student
  const subRes = await client.execute({
    sql: "SELECT id, homeworkId FROM homework_submissions WHERE studentId = ?",
    args: [student.id]
  });
  console.log('Student Submissions:', subRes.rows);

  // Performance (Marks)
  const marksRes = await client.execute({
    sql: "SELECT id, marksObtained, totalMarks FROM marks WHERE studentId = ?",
    args: [student.id]
  });
  console.log('Performance Marks:', marksRes.rows);

  process.exit(0);
}

inspectStudentData();
