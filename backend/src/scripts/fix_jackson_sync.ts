import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function fixData() {
  try {
    const schoolId = '01c04470-ca69-4402-a990-5dc8a1dce15c';
    
    // 1. Create Class 10B if it doesn't exist
    const classId10B = uuidv4();
    await client.execute({
      sql: 'INSERT OR IGNORE INTO classes (id, schoolId, name, section, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      args: [classId10B, schoolId, '10th', 'B', new Date().toISOString(), new Date().toISOString()]
    });
    console.log('Class 10th B ensured.');

    // 2. Update Jackson's assignment to match DB exactly
    await client.execute({
      sql: "UPDATE staff SET classes = '10thA, 10thB' WHERE email = 'jackson@gmail.com'",
      args: []
    });
    console.log("Jackson's classes updated to '10thA, 10thB'.");

    // 3. Link some students to these classes
    // Get class IDs
    const class10A = await client.execute({
      sql: "SELECT id FROM classes WHERE schoolId = ? AND name = '10th' AND section = 'A'",
      args: [schoolId]
    });
    const id10A = class10A.rows[0]?.id;

    if (id10A) {
      await client.execute({
        sql: "UPDATE students SET classId = ?, grade = '10th', section = 'A' WHERE schoolId = ? AND (name LIKE 'Student%' OR name = 'Unknown Student') LIMIT 5",
        args: [id10A, schoolId]
      });
      console.log('Linked 5 students to Class 10th A.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.close();
  }
}

fixData();
