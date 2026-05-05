const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function initTables() {
  console.log('🏗️ Initializing Financial Tables...');
  
  try {
    // 1. salary_payments
    console.log('Creating salary_payments table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS salary_payments (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        staffId TEXT NOT NULL,
        amount INTEGER NOT NULL,
        bonus INTEGER DEFAULT 0,
        deductions INTEGER DEFAULT 0,
        month TEXT NOT NULL,
        paymentDate TEXT DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'paid',
        transactionId TEXT,
        notes TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. support_tickets
    console.log('Creating support_tickets table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        studentId TEXT,
        staffId TEXT,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        category TEXT NOT NULL,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'open',
        assignedTo TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. requisitions (just in case)
    console.log('Creating requisitions table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS requisitions (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        itemName TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        priority TEXT DEFAULT 'medium',
        reason TEXT,
        status TEXT DEFAULT 'pending',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ All tables successfully created/verified.');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
  process.exit(0);
}

initTables();
