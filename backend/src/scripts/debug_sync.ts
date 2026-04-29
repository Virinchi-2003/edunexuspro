import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function checkData() {
  try {
    const classesResult = await client.execute('SELECT * FROM classes');
    console.log('--- CLASSES TABLE ---');
    console.table(classesResult.rows);

    const staffResult = await client.execute("SELECT name, email, classes, schoolId FROM staff WHERE email = 'jackson@gmail.com'");
    console.log('--- JACKSON STAFF DATA ---');
    console.table(staffResult.rows);

    const studentsResult = await client.execute('SELECT name, classId, grade, section FROM students LIMIT 10');
    console.log('--- STUDENTS TABLE (LIMIT 10) ---');
    console.table(studentsResult.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.close();
  }
}

checkData();
