const { createClient } = require('@libsql/client');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function forceSync() {
  console.log('🔄 Reconciling Institutional Records...');
  
  // 1. Find paid leads not converted
  const leadsRes = await client.execute("SELECT * FROM leads WHERE paymentStatus = 'paid' AND status != 'converted'");
  const leads = leadsRes.rows;

  if (leads.length === 0) {
    console.log('✅ All institutions are already in sync.');
    process.exit(0);
  }

  for (const lead of leads) {
    // 2. Check if school already exists by email
    const schoolRes = await client.execute({
      sql: "SELECT id FROM schools WHERE contactEmail = ?",
      args: [lead.email]
    });

    if (schoolRes.rows.length === 0) {
      console.log(`➕ Provisioning Institution: ${lead.schoolName}...`);
      const schoolId = uuidv4();
      const now = new Date().toISOString();
      
      // Insert School
      await client.execute({
        sql: "INSERT INTO schools (id, name, address, contactEmail, subscriptionPlan, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)",
        args: [schoolId, lead.schoolName, 'Provisioned from Sales Payment', lead.email, lead.plan || 'starter', now, now]
      });

      // Insert Admin User (Principal role)
      await client.execute({
        sql: "INSERT INTO users (uid, email, role, schoolId, status, createdAt) VALUES (?, ?, 'principal', ?, 'active', ?)",
        args: [uuidv4(), lead.email, schoolId, now]
      });
      
      console.log(`✅ ${lead.schoolName} successfully provisioned.`);
    }

    // 3. Mark lead as converted
    await client.execute({
      sql: "UPDATE leads SET status = 'converted' WHERE id = ?",
      args: [lead.id]
    });
  }

  console.log('\n✨ Database Synchronization Complete. All paid institutions are now active.');
  process.exit(0);
}

forceSync().catch(console.error);
