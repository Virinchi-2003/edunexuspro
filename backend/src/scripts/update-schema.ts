import { turso } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

async function updateSchema() {
  console.log('🚀 Starting schema update...');
  
  try {
    console.log('Adding photoURL to users table...');
    await turso.execute('ALTER TABLE users ADD COLUMN photoURL TEXT');
    console.log('✅ Added photoURL to users');
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️ photoURL already exists in users');
    } else {
      console.error('❌ Error adding to users:', error.message);
    }
  }

  try {
    console.log('Adding photoURL to staff table...');
    await turso.execute('ALTER TABLE staff ADD COLUMN photoURL TEXT');
    console.log('✅ Added photoURL to staff');
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️ photoURL already exists in staff');
    } else {
      console.error('❌ Error adding to staff:', error.message);
    }
  }

  try {
    console.log('Adding photoURL to students table...');
    await turso.execute('ALTER TABLE students ADD COLUMN photoURL TEXT');
    console.log('✅ Added photoURL to students');
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️ photoURL already exists in students');
    } else {
      console.error('❌ Error adding to students:', error.message);
    }
  }

  console.log('🎉 Schema update completed.');
}

updateSchema();
