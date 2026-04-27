const { createClient } = require('@libsql/client');
require('dotenv').config({ path: 'c:/EduNexusPro/backend/.env' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function seedFees() {
  console.log('🌱 Seeding sample fee data...');
  const schoolId = 'f12d0903-8e95-47d0-868f-2e0c100bb1de';

  try {
    const studentsRes = await client.execute({
      sql: 'SELECT id FROM students WHERE schoolId = ?',
      args: [schoolId]
    });

    if (studentsRes.rows.length === 0) return;

    console.log(`Found ${studentsRes.rows.length} students. Updating fees...`);

    for (let i = 0; i < studentsRes.rows.length; i++) {
      const studentId = studentsRes.rows[i].id;
      const amount = 25000 + (Math.floor(Math.random() * 10) * 1000);
      const status = Math.random() > 0.3 ? 'paid' : 'unpaid';
      const paidAmount = status === 'paid' ? amount : 0;

      await client.execute({
        sql: 'INSERT INTO fees (id, schoolId, studentId, amount, paidAmount, status, feeType, dueDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          require('uuid').v4(),
          schoolId,
          studentId,
          amount,
          paidAmount,
          status,
          'Tuition Fee',
          '2026-06-30'
        ]
      });
    }

    console.log('✅ Fees seeded successfully.');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

seedFees();
