import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function seed() {
  console.log('🌱 Seeding Turso Database...');

  try {
    // 1. Clear existing users (optional, for clean seed)
    await turso.execute('DELETE FROM users');
    await turso.execute('DELETE FROM schools');

    // 2. Insert a sample school
    const schoolId = uuidv4();
    await turso.execute({
      sql: 'INSERT INTO schools (id, name, address, contactEmail, subscriptionPlan, status) VALUES (?, ?, ?, ?, ?, ?)',
      args: [schoolId, 'Global International School', 'Hyderabad, TS', 'contact@global.edu', 'elite', 'active']
    });

    // 3. Insert Admin User
    await turso.execute({
      sql: 'INSERT INTO users (uid, email, role, schoolId) VALUES (?, ?, ?, ?)',
      args: ['admin-uid-123', 'admin@edunexus.pro', 'admin', null]
    });

    // 4. Insert Student Users
    const students = [
      { uid: 'student-uid-001', email: 'student1@edunexus.pro', role: 'student' },
      { uid: 'student-uid-002', email: 'student2@edunexus.pro', role: 'student' }
    ];

    for (const student of students) {
      await turso.execute({
        sql: 'INSERT INTO users (uid, email, role, schoolId) VALUES (?, ?, ?, ?)',
        args: [student.uid, student.email, student.role, schoolId]
      });
    }

    console.log('✅ Seeding complete!');
    console.log('\n--- Test Credentials ---');
    console.log('Admin: admin@edunexus.pro / password123');
    console.log('Student 1: student1@edunexus.pro / password123');
    console.log('Student 2: student2@edunexus.pro / password123');
    console.log('------------------------');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

seed();
