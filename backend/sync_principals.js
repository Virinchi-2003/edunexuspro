const { createClient } = require('@libsql/client');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function syncPrincipals() {
  console.log('🛡️ Reconciling Principal Records...');

  // 1. Get all converted leads
  const leadsRes = await client.execute("SELECT * FROM leads WHERE status = 'converted'");
  const leads = leadsRes.rows;

  // 2. Get all schools to match by email
  const schoolsRes = await client.execute("SELECT * FROM schools");
  const schools = schoolsRes.rows;

  for (const lead of leads) {
    // Find the corresponding school
    const school = schools.find(s => s.contactEmail === lead.email);
    if (!school) continue;

    // Check if principal already exists
    const principalCheck = await client.execute({
      sql: "SELECT id FROM principals WHERE email = ?",
      args: [lead.email]
    });

    if (principalCheck.rows.length === 0) {
      console.log(`➕ Creating Principal Record for: ${lead.adminName} (${school.name})`);
      const principalId = uuidv4();
      const now = new Date().toISOString();

      await client.execute({
        sql: "INSERT INTO principals (id, schoolId, name, email, phone, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)",
        args: [principalId, school.id, lead.adminName, lead.email, lead.phone, now, now]
      });
    }
  }

  console.log('\n✨ Principal records synchronized with school leadership.');
  process.exit(0);
}

syncPrincipals().catch(console.error);
