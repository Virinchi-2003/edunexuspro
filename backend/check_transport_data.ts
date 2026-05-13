import { db } from './src/config/database';
import { students, transportRoutes, transportStops } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function checkData() {
  try {
    const allStudents = await db.select().from(students).limit(10);
    console.log('Students:', allStudents.map(s => ({ id: s.id, studentId: s.studentId, name: s.name })));

    const allRoutes = await db.select().from(transportRoutes).limit(10);
    console.log('Routes:', allRoutes.map(r => ({ id: r.id, routeName: r.routeName })));

    const allStops = await db.select().from(transportStops).limit(20);
    console.log('Stops:', allStops.map(s => ({ id: s.id, stopName: s.stopName, routeId: s.routeId })));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

checkData();
