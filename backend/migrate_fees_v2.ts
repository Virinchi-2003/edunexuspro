import { turso } from './src/config/database';

async function migrateFeeStructures() {
  try {
    console.log('--- Migrating Fee Structures Table ---');
    
    // Add new columns if they don't exist
    const columns = [
      'tuitionFees',
      'transportFees',
      'libraryFees',
      'examFees',
      'activityFees',
      'otherFees'
    ];

    for (const col of columns) {
      try {
        await turso.execute(`ALTER TABLE fee_structures ADD COLUMN ${col} INTEGER DEFAULT 0`);
        console.log(`Added column: ${col}`);
      } catch (err: any) {
        if (err.message.includes('duplicate column name')) {
          console.log(`Column ${col} already exists, skipping.`);
        } else {
          console.error(`Error adding ${col}:`, err.message);
        }
      }
    }

    console.log('Migration complete.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateFeeStructures().catch(console.error);
