import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './src/db/schema';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client, { schema });

async function check() {
  const allStudents = await db.query.students.findMany({ limit: 5 });
  console.log('Students:', JSON.stringify(allStudents, null, 2));
  
  const allLeaves = await db.query.leaveRequests.findMany({ limit: 5 });
  console.log('Leaves:', JSON.stringify(allLeaves, null, 2));
  
  process.exit(0);
}

check();
