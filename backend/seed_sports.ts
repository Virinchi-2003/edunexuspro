import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function seedSports() {
  const schoolId = '01c04470-ca69-4402-a990-5dc8a1dce15c';
  const sports = [
    { name: 'Cricket', description: 'Major outdoor sport' },
    { name: 'Football', description: 'Universal team sport' },
    { name: 'Volleyball', description: 'Dynamic court sport' },
    { name: 'Basketball', description: 'Fast-paced court sport' }
  ];

  for (const sport of sports) {
    try {
      const id = uuidv4();
      await client.execute({
        sql: "INSERT INTO sports (id, schoolId, name, description) VALUES (?, ?, ?, ?)",
        args: [id, schoolId, sport.name, sport.description]
      });
      console.log(`Seeded: ${sport.name}`);
    } catch (e: any) {
      console.error(`Failed ${sport.name}:`, e.message);
    }
  }
  process.exit(0);
}

seedSports();
