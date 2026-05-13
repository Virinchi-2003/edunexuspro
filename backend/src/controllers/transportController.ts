import { Request, Response } from 'express';
import { db } from '../config/database';
import { buses, transportRoutes, transportStops, transportAssignments, students, staff } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';

// --- Bus Management ---
export const getBuses = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.buses.findMany({
    where: eq(buses.schoolId, schoolId),
    with: {
      route: true
    }
  });
  res.status(200).json({ status: 'success', data: result });
});

export const createBus = asyncHandler(async (req: Request, res: Response) => {
  const id = uuidv4();
  await db.insert(buses).values({
    id,
    ...req.body
  });
  res.status(201).json({ status: 'success', message: 'Bus created successfully' });
});

export const updateBus = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  await db.update(buses).set({ ...req.body, updatedAt: new Date().toISOString() }).where(eq(buses.id, id));
  res.status(200).json({ status: 'success', message: 'Bus updated successfully' });
});

export const deleteBus = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  await db.delete(buses).where(eq(buses.id, id));
  res.status(200).json({ status: 'success', message: 'Bus deleted successfully' });
});

// --- Route Management ---
export const getRoutes = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.transportRoutes.findMany({
    where: eq(transportRoutes.schoolId, schoolId),
    with: {
      stops: {
        orderBy: (stops, { asc }) => [asc(stops.order)]
      },
      buses: true
    }
  });
  res.status(200).json({ status: 'success', data: result });
});

export const createRoute = asyncHandler(async (req: Request, res: Response) => {
  const id = uuidv4();
  const { routeName, area, schoolId } = req.body;
  await db.insert(transportRoutes).values({ id, routeName, area, schoolId });
  res.status(201).json({ status: 'success', data: { id, routeName, area } });
});

// --- Stop Management ---
export const createStop = asyncHandler(async (req: Request, res: Response) => {
  const id = uuidv4();
  await db.insert(transportStops).values({ id, ...req.body });
  res.status(201).json({ status: 'success', message: 'Stop added successfully' });
});

export const updateStop = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  await db.update(transportStops).set({ ...req.body, updatedAt: new Date().toISOString() }).where(eq(transportStops.id, id));
  res.status(200).json({ status: 'success', message: 'Stop updated successfully' });
});

export const deleteStop = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  await db.delete(transportStops).where(eq(transportStops.id, id));
  res.status(200).json({ status: 'success', message: 'Stop deleted successfully' });
});

// --- Assignments ---
export const assignTransport = asyncHandler(async (req: Request, res: Response) => {
  const { userId, role, routeId, stopId, schoolId } = req.body;

  // 1. Capacity Check
  const bus = await db.query.buses.findFirst({
    where: and(eq(buses.schoolId, schoolId), eq(buses.routeId, routeId))
  });

  if (bus) {
    const existingAssignments = await db.query.transportAssignments.findMany({
      where: and(eq(transportAssignments.schoolId, schoolId), eq(transportAssignments.routeId, routeId))
    });

    if (existingAssignments.length >= bus.capacity) {
      return res.status(400).json({ status: 'error', message: 'Bus capacity reached for this route' });
    }
  }

  // 2. Remove existing assignment for user
  await db.delete(transportAssignments).where(
    and(eq(transportAssignments.schoolId, schoolId), eq(transportAssignments.userId, userId))
  );

  // 3. Create new assignment
  const id = uuidv4();
  await db.insert(transportAssignments).values({ id, userId, role, routeId, stopId, schoolId });

  res.status(201).json({ status: 'success', message: 'Transport assigned successfully' });
});

export const bulkAssignTransport = asyncHandler(async (req: Request, res: Response) => {
  const { assignments: data, schoolId } = req.body;

  if (!Array.isArray(data)) {
    return res.status(400).json({ status: 'error', message: 'Invalid data format. Expected an array of assignments.' });
  }

  if (!schoolId) {
    return res.status(400).json({ status: 'error', message: 'School ID is required' });
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (let item of data) {
    try {
      // Normalize keys to lowercase and trim
      const normalizedItem: any = {};
      Object.keys(item).forEach(key => {
        const normalizedKey = key.trim().toLowerCase();
        normalizedItem[normalizedKey] = item[key];
      });

      // Use normalized keys
      const rawStudentId = normalizedItem['studentid'] || normalizedItem['student id'];
      const rawRouteName = normalizedItem['routename'] || normalizedItem['route name'];
      const rawStopName = normalizedItem['stopname'] || normalizedItem['stop name'];

      // Advanced Normalization: Strip '#' from ID and handle '(Time)' in stop name
      let studentId = rawStudentId?.toString().trim().replace(/^#/, '');
      let routeName = rawRouteName?.toString().trim();
      let stopName = rawStopName?.toString().trim();

      // If stopName contains parentheses (e.g. "KPHB (08:30)"), take only the name part
      if (stopName && stopName.includes('(')) {
        stopName = stopName.split('(')[0].trim();
      }

      console.log(`Processing assignment: Student=${studentId}, Route=${routeName}, Stop=${stopName}`);

      if (!studentId || !routeName || !stopName) {
        results.failed++;
        results.errors.push(`Missing data for student ${studentId || 'unknown'}. Ensure columns are 'studentId', 'routeName', and 'stopName'.`);
        continue;
      }

      // 1. Find Student
      const student = await db.query.students.findFirst({
        where: and(eq(students.schoolId, schoolId), eq(students.studentId, studentId))
      });

      if (!student) {
        results.failed++;
        results.errors.push(`Student with ID ${studentId} not found in database`);
        continue;
      }

      // 2. Find Route
      const route = await db.query.transportRoutes.findFirst({
        where: and(eq(transportRoutes.schoolId, schoolId), eq(transportRoutes.routeName, routeName))
      });

      if (!route) {
        results.failed++;
        results.errors.push(`Route "${routeName}" not found in database`);
        continue;
      }

      // 3. Find Stop
      const stop = await db.query.transportStops.findFirst({
        where: and(eq(transportStops.routeId, route.id), eq(transportStops.stopName, stopName))
      });

      if (!stop) {
        results.failed++;
        results.errors.push(`Stop "${stopName}" not found in route "${routeName}"`);
        continue;
      }

      // 4. Capacity Check (optional but good)
      const bus = await db.query.buses.findFirst({
        where: and(eq(buses.schoolId, schoolId), eq(buses.routeId, route.id))
      });

      if (bus) {
        const existingAssignments = await db.query.transportAssignments.findMany({
          where: and(eq(transportAssignments.schoolId, schoolId), eq(transportAssignments.routeId, route.id))
        });

        if (existingAssignments.length >= bus.capacity) {
          results.failed++;
          results.errors.push(`Bus capacity reached for route ${routeName} (Student: ${studentId})`);
          continue;
        }
      }

      // 5. Remove existing assignment
      await db.delete(transportAssignments).where(
        and(eq(transportAssignments.schoolId, schoolId), eq(transportAssignments.userId, student.id))
      );

      // 6. Create new assignment
      const id = uuidv4();
      await db.insert(transportAssignments).values({
        id,
        userId: student.id,
        role: 'student',
        routeId: route.id,
        stopId: stop.id,
        schoolId
      });

      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Unexpected error for student ${item.studentId}: ${(error as any).message}`);
    }
  }

  res.status(200).json({
    status: 'success',
    message: `Bulk assignment completed. Success: ${results.success}, Failed: ${results.failed}`,
    data: results
  });
});

export const getUserTransport = asyncHandler(async (req: Request, res: Response) => {
  const userId = getSingleValue(req.params.id);
  const assignment = await db.query.transportAssignments.findFirst({
    where: eq(transportAssignments.userId, userId),
    with: {
      route: {
        with: {
          stops: {
            orderBy: (stops, { asc }) => [asc(stops.order)]
          },
          buses: true
        }
      },
      stop: true
    }
  });

  if (!assignment) {
    return res.status(200).json({ status: 'success', data: null });
  }

  res.status(200).json({ status: 'success', data: assignment });
});

export const getAssignments = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.transportAssignments.findMany({
    where: eq(transportAssignments.schoolId, schoolId),
    with: {
      route: true,
      stop: true
    }
  });

  // Manually fetch user names since we don't have direct relations to both students/staff in the schema yet
  const enrichedResult = await Promise.all(result.map(async (a) => {
    let name = "Unknown";
    let identifier = "N/A";
    if (a.role === 'student') {
      const s = await db.query.students.findFirst({ where: eq(students.id, a.userId) });
      name = s?.name || "Unknown";
      identifier = s?.studentId || "N/A";
    } else {
      const s = await db.query.staff.findFirst({ where: eq(staff.id, a.userId) });
      name = s?.name || "Unknown";
      identifier = s?.id || "N/A";
    }
    return { ...a, name, identifier };
  }));

  res.status(200).json({ status: 'success', data: enrichedResult });
});

export const deleteAssignment = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  await db.delete(transportAssignments).where(eq(transportAssignments.id, id));
  res.status(200).json({ status: 'success', message: 'Assignment removed' });
});
