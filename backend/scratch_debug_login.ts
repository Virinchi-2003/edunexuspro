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

async function debugLogin() {
  const email = 'student@example.com'; // Adjust based on known users
  const password = 'password123';

  try {
    console.log('Searching for user...');
    const user = await db.query.users.findFirst({
      where: and(eq(schema.users.email, email), eq(schema.users.password, password))
    });
    
    if (user) {
      console.log('User found:', user.email, user.role);
    } else {
      console.log('User not found with those credentials.');
      
      // Try to find any user to see if the table is accessible
      const anyUser = await db.query.users.findFirst();
      if (anyUser) {
        console.log('Found another user:', anyUser.email);
      } else {
        console.log('No users found in the database.');
      }
    }
  } catch (error) {
    console.error('Error during login debug:', error);
  } finally {
    client.close();
  }
}

debugLogin();
