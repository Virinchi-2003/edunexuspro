import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './src/db/schema';
import dotenv from 'dotenv';
import { eq, and } from 'drizzle-orm';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client, { schema });

async function debugLoginDetails() {
  const email = 'admin@edunexus.pro';
  
  try {
    console.log('Fetching user details for:', email);
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email)
    });
    
    if (user) {
      console.log('User object keys:', Object.keys(user));
      console.log('User object:', JSON.stringify(user, null, 2));
    } else {
      console.log('User not found.');
    }
  } catch (error) {
    console.error('Error fetching user:', error);
  } finally {
    client.close();
  }
}

debugLoginDetails();
