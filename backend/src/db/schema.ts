import { sqliteTable, text, real, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

export const schools = sqliteTable('schools', {
  id: text('id').primaryKey(),
  school_id: text('school_id').unique(), // Human-readable ID
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
  password: text('password'),
  phone: text('phone').notNull(),
  userId: text('userId'),
  status: text('status').default('active'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});



export const classes = sqliteTable('classes', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // e.g., "10"
  section: text('section').notNull(), // e.g., "A"
  roomNumber: text('roomNumber'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});

export const students = sqliteTable('students', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  classId: text('classId').references(() => classes.id, { onDelete: 'set null' }),
  studentId: text('studentId').notNull().unique(), 
  name: text('name').notNull(),
  parentName: text('parentName'),
  email: text('email'),
  phone: text('phone'),
  password: text('password'),
  grade: text('grade').notNull(), // Kept for legacy/direct access
  section: text('section'), // Kept for legacy/direct access
  status: text('status').default('active'),
  userId: text('userId'),
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
  emailAlerts: integer('emailAlerts', { mode: 'boolean' }).default(true),
  smsAlerts: integer('smsAlerts', { mode: 'boolean' }).default(false),
  darkMode: integer('darkMode', { mode: 'boolean' }).default(false),
  language: text('language').default('English'),
  status: text('status').default('active'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});

export const staff = sqliteTable('staff', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  userId: text('userId').references(() => users.uid, { onDelete: 'set null' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  password: text('password'),
  dob: text('dob'),
  department: text('department').notNull(), // 'teaching' | 'non-teaching'
  role: text('role').notNull(), // e.g., "Senior Teacher", "Accountant"
  
  // Teaching specific
  subjects: text('subjects'), // comma separated or JSON
  classes: text('classes'), // comma separated or JSON
  
  // Non-teaching specific
  branch: text('branch'),
  
  salary: integer('salary'),
  joiningDate: text('joiningDate').default(sql`CURRENT_TIMESTAMP`),
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

export const fees = sqliteTable('fees', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('studentId').notNull().references(() => students.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  paidAmount: integer('paidAmount').default(0),
  status: text('status', { enum: ['paid', 'unpaid', 'partially_paid'] }).default('unpaid'),
  dueDate: text('dueDate'),
  paymentDate: text('paymentDate'),
  transactionId: text('transactionId'),
  feeType: text('feeType').default('Tuition Fee'), // e.g., "Term 1", "Library Fee"
  lateFee: integer('lateFee').default(0),
  gracePeriodDays: integer('gracePeriodDays').default(5),
  challanNumber: text('challanNumber'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});

export const attendance = sqliteTable('attendance', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('studentId').references(() => students.id, { onDelete: 'cascade' }),
  staffId: text('staffId').references(() => staff.id, { onDelete: 'cascade' }),
  classId: text('classId').references(() => classes.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // ISO Date string (YYYY-MM-DD)
  status: text('status', { enum: ['present', 'absent', 'late'] }).notNull(),
  remarks: text('remarks'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  attendanceIdx: uniqueIndex('attendance_idx').on(table.schoolId, table.studentId, table.staffId, table.date),
}));

export const configs = sqliteTable('configs', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(students, {
    fields: [attendance.studentId],
    references: [students.id],
  }),
  staff: one(staff, {
    fields: [attendance.staffId],
    references: [staff.id],
  }),
}));

export const feesRelations = relations(fees, ({ one }) => ({
  student: one(students, {
    fields: [fees.studentId],
    references: [students.id],
  }),
  school: one(schools, {
    fields: [fees.schoolId],
    references: [schools.id],
  }),
}));

export const studentRelations = relations(students, ({ many }) => ({
  attendance: many(attendance),
  fees: many(fees),
}));

export const schoolRelations = relations(schools, ({ many }) => ({
  students: many(students),
  staff: many(staff),
  fees: many(fees),
  attendance: many(attendance),
}));

export const staffRelations = relations(staff, ({ many }) => ({
  attendance: many(attendance),
}));
