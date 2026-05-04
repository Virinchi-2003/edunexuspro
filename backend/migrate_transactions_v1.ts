import { turso } from './src/config/database';

async function migrateTransactions() {
  try {
    console.log('--- Migrating Fee Transactions Table ---');
    try {
      await turso.execute(`ALTER TABLE fee_transactions ADD COLUMN breakdown TEXT`);
      console.log(`Added column: breakdown`);
    } catch (err: any) {
      if (err.message.includes('duplicate column name')) {
        console.log(`Column breakdown already exists, skipping.`);
      } else {
        console.error(`Error adding breakdown:`, err.message);
      }
    }
    console.log('Migration complete.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateTransactions().catch(console.error);
