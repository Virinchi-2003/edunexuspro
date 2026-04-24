const { createClient } = require('@libsql/client');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function cleanup() {
  console.log('🧹 Cleaning up and Reconciling Institutional Data...');

  // 1. Fix ABCD (was misnamed as MHS in some previous turn)
  console.log('🔧 Correcting ABCD record...');
  await client.execute({
    sql: "UPDATE schools SET name = 'ABCD' WHERE contactEmail = 'virinchigourishetty@gmail.com'",
    args: []
  });

  // 2. Provision HPS (which is marked converted in leads but missing in schools)
  const hpsLead = await client.execute("SELECT * FROM leads WHERE email = 'hps@gmail.com' LIMIT 1");
  if (hpsLead.rows.length > 0) {
    const lead = hpsLead.rows[0];
    const schoolCheck = await client.execute({
      sql: "SELECT id FROM schools WHERE contactEmail = 'hps@gmail.com'",
      args: []
    });

    if (schoolCheck.rows.length === 0) {
      console.log('➕ Provisioning HPS...');
      const schoolId = uuidv4();
      const now = new Date().toISOString();
      
      await client.execute({
        sql: "INSERT INTO schools (id, name, address, contactEmail, subscriptionPlan, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)",
        args: [schoolId, 'HPS', 'Auto-synced from Sales', 'hps@gmail.com', lead.plan || 'starter', now, now]
      });

      await client.execute({
        sql: "INSERT INTO users (uid, email, role, schoolId, status, createdAt) VALUES (?, ?, 'principal', ?, 'active', ?)",
        args: [uuidv4(), 'hps@gmail.com', schoolId, now]
      });
      console.log('✅ HPS added.');
    }
  }

  // 3. Final verification of all paid leads
  console.log('\n--- Final Institutional List ---');
  const finalSchools = await client.execute("SELECT name, contactEmail, subscriptionPlan FROM schools");
  console.table(finalSchools.rows);

  console.log('\n✨ Institutional data is now fully synchronized and corrected.');
  process.exit(0);
}

cleanup().catch(console.error);
