import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const schools = sqliteTable('schools', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  contactEmail: text('contactEmail').notNull(),
  subscriptionPlan: text('subscriptionPlan').notNull(),
  status: text('status', { enum: ['active', 'suspended', 'pending'] }).default('active'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});

export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  plan: text('plan').notNull(),
  status: text('status').notNull(),
  startDate: text('startDate').notNull(),
  endDate: text('endDate').notNull(),
  amount: real('amount').notNull(),
  transactionId: text('transactionId'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});

export const principals = sqliteTable('principals', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  userId: text('userId'),
  status: text('status').default('active'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});

export const teachers = sqliteTable('teachers', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  subject: text('subject'),
  userId: text('userId'),
  status: text('status').default('active'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});

export const students = sqliteTable('students', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  rollNumber: text('rollNumber').notNull(),
  grade: text('grade').notNull(),
  section: text('section'),
  status: text('status').default('active'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});

export const users = sqliteTable('users', {
  uid: text('uid').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  phoneNumber: text('phoneNumber'),
  password: text('password'),
  role: text('role').notNull(),
  schoolId: text('schoolId').references(() => schools.id, { onDelete: 'set null' }),
  status: text('status').default('active'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});

export const leads = sqliteTable('leads', {
  id: text('id').primaryKey(),
  schoolName: text('schoolName').notNull(),
  adminName: text('adminName').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  message: text('message'),
  reply: text('reply'),
  adminNote: text('adminNote'),
  plan: text('plan'),
  paymentStatus: text('paymentStatus', { enum: ['pending', 'paid', 'failed'] }).default('pending'),
  status: text('status', { enum: ['new', 'contacted', 'converted', 'rejected'] }).default('new'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
});

export const configs = sqliteTable('configs', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});
