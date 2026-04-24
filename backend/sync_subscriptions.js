const { createClient } = require('@libsql/client');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const planPrices = {
  'starter': 4999,
  'growth': 9999,
  'pro': 18999,
  'elite': 50000
};

async function syncSubscriptions() {
  console.log('💳 Reconciling Subscription Records...');

  // 1. Get all schools
  const schoolsRes = await client.execute("SELECT * FROM schools");
  const schools = schoolsRes.rows;

  for (const school of schools) {
    // Check if subscription already exists
    const subCheck = await client.execute({
      sql: "SELECT id FROM subscriptions WHERE schoolId = ?",
      args: [school.id]
    });

    if (subCheck.rows.length === 0) {
      console.log(`➕ Creating Subscription Record for: ${school.name} (${school.subscriptionPlan})`);
      const subId = uuidv4();
      const now = new Date();
      const startDate = now.toISOString();
      const endDate = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
      const amount = planPrices[school.subscriptionPlan?.toLowerCase()] || 4999;

      await client.execute({
        sql: "INSERT INTO subscriptions (id, schoolId, plan, status, startDate, endDate, amount, createdAt, updatedAt) VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?)",
        args: [subId, school.id, school.subscriptionPlan || 'starter', startDate, endDate, amount, startDate, startDate]
      });
    }
  }

  console.log('\n✨ Subscription records synchronized with institutional plans.');
  process.exit(0);
}

syncSubscriptions().catch(console.error);
