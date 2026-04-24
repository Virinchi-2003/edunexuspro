import { db } from './src/config/database';
import { schools, leads } from './src/db/schema';

async function check() {
  console.log('--- SCHOOLS ---');
  const allSchools = await db.select().from(schools);
  console.table(allSchools.map(s => ({ id: s.id, name: s.name, plan: s.subscriptionPlan })));

  console.log('\n--- LEADS (PAID but not CONVERTED) ---');
  const pendingLeads = await db.query.leads.findMany({
    where: (leads, { and, eq, ne }) => and(
      eq(leads.paymentStatus, 'paid'),
      ne(leads.status, 'converted')
    )
  });
  console.table(pendingLeads.map(l => ({ id: l.id, school: l.schoolName, payment: l.paymentStatus, status: l.status })));
  
  process.exit(0);
}

check();
