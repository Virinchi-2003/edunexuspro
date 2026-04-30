const { createClient } = require('@libsql/client');
require('dotenv').config({ path: './.env' });

async function createTable() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log('Creating fee_transactions table...');

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS fee_transactions (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        studentId TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        razorpayOrderId TEXT,
        razorpayPaymentId TEXT,
        status TEXT NOT NULL,
        receiptUrl TEXT,
        gstAmount REAL DEFAULT 0,
        invoiceNumber TEXT,
        paymentMethod TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating table:', error);
    process.exit(1);
  }
}

createTable();
