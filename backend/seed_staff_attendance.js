const { createClient } = require('@libsql/client');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: 'c:/EduNexusPro/backend/.env' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function seedStaffAttendance() {
  console.log('🌱 Seeding sample staff attendance data...');
  const schoolId = 'f12d0903-8e95-47d0-868f-2e0c100bb1de';
  const today = new Date().toISOString().split('T')[0];

  try {
    const staffRes = await client.execute({
      sql: 'SELECT id FROM staff WHERE schoolId = ?',
      args: [schoolId]
    });

    if (staffRes.rows.length === 0) {
      console.log('⚠️ No staff found. Creating one sample staff...');
      const staffId = uuidv4();
      await client.execute({
        sql: 'INSERT INTO staff (id, schoolId, name, email, role, department) VALUES (?, ?, ?, ?, ?, ?)',
        args: [staffId, schoolId, 'John Teacher', 'john@school.com', 'teacher', 'teaching']
      });
      staffRes.rows = [{ id: staffId }];
    }

    console.log(`Found ${staffRes.rows.length} staff members. Marking present...`);

    for (const member of staffRes.rows) {
      await client.execute({
        sql: 'INSERT INTO attendance (id, schoolId, staffId, date, status) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING',
        args: [uuidv4(), schoolId, member.id, today, 'present']
      });
    }

    console.log('✅ Staff attendance seeded successfully.');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

seedStaffAttendance();
