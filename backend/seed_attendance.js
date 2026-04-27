const { createClient } = require('@libsql/client');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: 'c:/EduNexusPro/backend/.env' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function seed() {
  console.log('🌱 Seeding sample attendance data...');
  const schoolId = 'f12d0903-8e95-47d0-868f-2e0c100bb1de'; // The one from user logs
  const today = new Date().toISOString().split('T')[0];

  try {
    const studentsRes = await client.execute({
      sql: 'SELECT id FROM students WHERE schoolId = ?',
      args: [schoolId]
    });

    if (studentsRes.rows.length === 0) {
      console.log('⚠️ No students found for this school. Cannot seed attendance.');
      return;
    }

    console.log(`Found ${studentsRes.rows.length} students. Marking 95% present...`);

    for (let i = 0; i < studentsRes.rows.length; i++) {
      const student = studentsRes.rows[i];
      const status = Math.random() > 0.05 ? 'present' : 'absent';
      
      await client.execute({
        sql: 'INSERT INTO attendance (id, schoolId, studentId, date, status) VALUES (?, ?, ?, ?, ?)',
        args: [uuidv4(), schoolId, student.id, today, status]
      });
    }

    console.log('✅ Attendance seeded successfully.');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

seed();
