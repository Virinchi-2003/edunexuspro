import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const db = drizzle(client, { schema });
export const turso = client; // Keep for legacy raw queries if needed

export const initDb = async () => {
  try {
    console.log('🔄 Checking Database Schema Sync...');
    // In a real production environment, you'd use migrations.
    // For "autosync", drizzle-kit push is used during development.
    // Here we just ensure the client is connected.
    await client.execute('SELECT 1');
    
    // Self-healing: Ensure new columns exist
    try {
      await client.execute('ALTER TABLE users ADD COLUMN resetPasswordToken TEXT');
      await client.execute('ALTER TABLE users ADD COLUMN resetPasswordExpires TEXT');
      console.log('✅ Added reset password columns to users table.');
    } catch (e) {
      // Columns likely already exist
    }

    // Self-healing: Ensure new columns exist
    const addColumn = async (table: string, col: string, type: string) => {
      try {
        await client.execute(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
        console.log(`✅ Added ${col} column to ${table}.`);
      } catch (e) {}
    };

    await addColumn('leave_requests', 'aiStatus', 'TEXT');
    await addColumn('leave_requests', 'aiReason', 'TEXT');
    await addColumn('leave_requests', 'aiConfidence', 'REAL');
    await addColumn('leave_requests', 'updatedAt', 'TEXT');
    await addColumn('salary_payments', 'updatedAt', 'TEXT');
    await addColumn('wallet_transactions', 'updatedAt', 'TEXT');
    await addColumn('recharge_logs', 'updatedAt', 'TEXT');
    
    // Students table updates
    await addColumn('students', 'documents', 'TEXT');
    await addColumn('students', 'fatherOccupation', 'TEXT');
    await addColumn('students', 'motherName', 'TEXT');
    await addColumn('students', 'motherOccupation', 'TEXT');
    await addColumn('students', 'annualIncome', 'TEXT');

    // Self-healing: Ensure requisitions table exists
    await client.execute(`
      CREATE TABLE IF NOT EXISTS requisitions (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        itemName TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        priority TEXT DEFAULT 'medium',
        reason TEXT,
        status TEXT DEFAULT 'pending',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS payroll_approvals (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        month TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        approvedBy TEXT,
        approvedAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Self-healing: Ensure wallet tables exist
    await client.execute(`
      CREATE TABLE IF NOT EXISTS wallets (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        studentId TEXT NOT NULL UNIQUE,
        balance REAL DEFAULT 0,
        status TEXT DEFAULT 'active',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        studentId TEXT NOT NULL,
        walletId TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        category TEXT DEFAULT 'others',
        vendor TEXT,
        description TEXT,
        status TEXT DEFAULT 'success',
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS wallet_limits (
        studentId TEXT PRIMARY KEY,
        dailyLimit REAL DEFAULT 500,
        weeklyLimit REAL DEFAULT 2000,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS recharge_logs (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        studentId TEXT NOT NULL,
        parentId TEXT,
        amount REAL NOT NULL,
        transactionId TEXT,
        status TEXT DEFAULT 'pending',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS transport_routes (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        routeName TEXT NOT NULL,
        area TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS transport_stops (
        id TEXT PRIMARY KEY,
        routeId TEXT NOT NULL,
        stopName TEXT NOT NULL,
        arrivalTime TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS buses (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        busNumber TEXT NOT NULL,
        driverName TEXT NOT NULL,
        driverPhone TEXT NOT NULL,
        cleanerName TEXT,
        cleanerPhone TEXT,
        vehicleType TEXT DEFAULT 'bus',
        capacity INTEGER NOT NULL,
        routeId TEXT,
        status TEXT DEFAULT 'active',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS transport_assignments (
        id TEXT PRIMARY KEY,
        schoolId TEXT NOT NULL,
        userId TEXT NOT NULL,
        role TEXT NOT NULL,
        routeId TEXT NOT NULL,
        stopId TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Turso Database Connected & Transport Tables Ready.');
  } catch (error) {
    console.error('❌ Failed to connect to Turso Database:', error);
  }
};
