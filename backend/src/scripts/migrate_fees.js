const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log('Migrating fees and fee_transactions tables...');

  try {
    // Add breakdown field to fees table
    try {
      await client.execute(`ALTER TABLE fees ADD COLUMN breakdown TEXT`);
      console.log('Added breakdown to fees');
    } catch (e) { console.log('breakdown column might already exist'); }
    
    // Add GST details to fee_transactions
    try {
      await client.execute(`ALTER TABLE fee_transactions ADD COLUMN gstAmount REAL DEFAULT 0`);
      console.log('Added gstAmount to fee_transactions');
    } catch (e) { console.log('gstAmount column might already exist'); }

    try {
      await client.execute(`ALTER TABLE fee_transactions ADD COLUMN invoiceNumber TEXT`);
      console.log('Added invoiceNumber to fee_transactions');
    } catch (e) { console.log('invoiceNumber column might already exist'); }

    try {
      await client.execute(`ALTER TABLE fee_transactions ADD COLUMN paymentMethod TEXT`);
      console.log('Added paymentMethod to fee_transactions');
    } catch (e) { console.log('paymentMethod column might already exist'); }
    
    console.log('Migration successful!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
