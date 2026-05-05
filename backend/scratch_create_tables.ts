import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function createMissingTables() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS skill_assessments (
      id text PRIMARY KEY NOT NULL,
      schoolId text NOT NULL,
      studentId text NOT NULL,
      sportId text,
      skill text NOT NULL,
      score integer NOT NULL,
      assessedBy text,
      comments text,
      createdAt text DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS sports (
      id text PRIMARY KEY NOT NULL,
      schoolId text NOT NULL,
      name text NOT NULL,
      coachId text,
      description text,
      createdAt text DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS sports_enrollments (
      id text PRIMARY KEY NOT NULL,
      studentId text NOT NULL,
      sportId text NOT NULL,
      joinedAt text DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS training_logs (
      id text PRIMARY KEY NOT NULL,
      studentId text NOT NULL,
      sportId text NOT NULL,
      duration integer,
      intensity integer,
      loadScore real,
      notes text,
      date text NOT NULL,
      createdAt text DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS fixtures (
      id text PRIMARY KEY NOT NULL,
      schoolId text NOT NULL,
      sportId text NOT NULL,
      opponentName text NOT NULL,
      venue text NOT NULL,
      locationUrl text,
      dateTime text NOT NULL,
      departureTime text,
      status text DEFAULT 'scheduled',
      score text,
      result text,
      createdAt text DEFAULT CURRENT_TIMESTAMP,
      updatedAt text DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS medical_records (
      id text PRIMARY KEY NOT NULL,
      studentId text NOT NULL,
      bmi real,
      staminaScore integer,
      sprintTime real,
      medicalFlags text,
      medications text,
      emergencyContact text,
      wearableData text,
      updatedAt text DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS inventory (
      id text PRIMARY KEY NOT NULL,
      schoolId text NOT NULL,
      itemName text NOT NULL,
      category text NOT NULL,
      totalQuantity integer NOT NULL,
      availableQuantity integer NOT NULL,
      lowStockAlert integer DEFAULT 5,
      createdAt text DEFAULT CURRENT_TIMESTAMP,
      updatedAt text DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS inventory_transactions (
      id text PRIMARY KEY NOT NULL,
      inventoryId text NOT NULL,
      studentId text,
      type text NOT NULL,
      quantity integer NOT NULL,
      signature text,
      status text DEFAULT 'active',
      fineAmount integer DEFAULT 0,
      transactionDate text DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS ai_flags (
      id text PRIMARY KEY NOT NULL,
      studentId text NOT NULL,
      type text NOT NULL,
      message text NOT NULL,
      severity text DEFAULT 'medium',
      isResolved integer DEFAULT 0,
      createdAt text DEFAULT CURRENT_TIMESTAMP
    );`
  ];

  for (const query of queries) {
    try {
      await client.execute(query);
      console.log('Executed:', query.split('\n')[0]);
    } catch (e: any) {
      console.error('Failed:', query.split('\n')[0], e.message);
    }
  }
  process.exit(0);
}

createMissingTables();
