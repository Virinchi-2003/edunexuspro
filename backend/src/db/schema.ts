import { sqliteTable, text, real, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

export const schools = sqliteTable('schools', {
  id: text('id').primaryKey(),
  school_id: text('school_id').unique('schools_sid_idx'), // Human-readable ID
  name: text('name').notNull(),
  address: text('address').notNull(),
  contactEmail: text('contactEmail').notNull(),
  subscriptionPlan: text('subscriptionPlan').notNull(),
  status: text('status', { enum: ['active', 'suspended', 'pending'] }).default('active'),
  currentAcademicYear: text('currentAcademicYear').default('2026-27'),
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
  email: text('email').notNull().unique('principals_email_idx'),
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
  photoURL: text('photoURL'),
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
  photoURL: text('photoURL'),
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
  photoURL: text('photoURL'),
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
  academicYear: text('academicYear').default('2026-27'),
  breakdown: text('breakdown'), // JSON string: { tuition: 5000, transport: 2000, activity: 1000 }
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});

export const feeStructures = sqliteTable('fee_structures', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  grade: text('grade').notNull(),
  tuitionFees: integer('tuitionFees').default(0),
  transportFees: integer('transportFees').default(0),
  libraryFees: integer('libraryFees').default(0),
  examFees: integer('examFees').default(0),
  activityFees: integer('activityFees').default(0),
  otherFees: integer('otherFees').default(0),
  amount: integer('amount').notNull(), // Total Amount
  description: text('description'),
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
  status: text('status', { enum: ['present', 'absent', 'late', 'half-day'] }).notNull(),
  remarks: text('remarks'),
  academicYear: text('academicYear').default('2026-27'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  attendanceUniqueIdx: uniqueIndex('attendance_uid_idx').on(table.schoolId, table.studentId, table.staffId, table.date),
}));

export const configs = sqliteTable('configs', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});



export const schoolRelations = relations(schools, ({ many }) => ({
  students: many(students),
  staff: many(staff),
  fees: many(fees),
  attendance: many(attendance),
}));

export const staffRelations = relations(staff, ({ many }) => ({
  assignments: many(teacherClassAssignments),
  attendance: many(attendance),
}));

export const teacherClassAssignments = sqliteTable('teacher_class_assignments', {
  id: text('id').primaryKey(),
  teacherId: text('teacherId').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  classId: text('classId').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
});

export const teacherClassAssignmentsRelations = relations(teacherClassAssignments, ({ one }) => ({
  teacher: one(staff, {
    fields: [teacherClassAssignments.teacherId],
    references: [staff.id],
  }),
  class: one(classes, {
    fields: [teacherClassAssignments.classId],
    references: [classes.id],
  }),
}));



export const admissions = sqliteTable('admissions', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentName: text('studentName').notNull(),
  parentName: text('parentName').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  grade: text('grade').notNull(),
  address: text('address'),
  dateOfBirth: text('dateOfBirth'),
  gender: text('gender'),
  aadhaarNumber: text('aadhaarNumber'),
  bloodGroup: text('bloodGroup'),
  previousSchool: text('previousSchool'),
  religion: text('religion'),
  category: text('category'),
  documents: text('documents'), // JSON string of filenames
  studentId: text('studentId'), // Generated ID after approval
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  appliedAt: text('appliedAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const admissionRelations = relations(admissions, ({ one }) => ({
  school: one(schools, {
    fields: [admissions.schoolId],
    references: [schools.id],
  }),
}));

// --- Timetable & Resource Planner ---

export const rooms = sqliteTable('rooms', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  capacity: integer('capacity'),
  type: text('type').default('classroom'), // classroom, lab, sports_ground
  status: text('status').default('available'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
});

export const timetable = sqliteTable('timetable', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  classId: text('classId').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // e.g. "Term 1 Schedule"
  isActive: integer('isActive', { mode: 'boolean' }).default(true),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
});

export const timetableSlots = sqliteTable('timetable_slots', {
  id: text('id').primaryKey(),
  timetableId: text('timetableId').notNull().references(() => timetable.id, { onDelete: 'cascade' }),
  dayOfWeek: text('dayOfWeek').notNull(), // Monday, Tuesday, etc.
  startTime: text('startTime').notNull(), // HH:MM
  endTime: text('endTime').notNull(), // HH:MM
  subject: text('subject').notNull(),
  teacherId: text('teacherId').references(() => staff.id, { onDelete: 'set null' }),
  roomId: text('roomId').references(() => rooms.id, { onDelete: 'set null' }),
});

export const substitutions = sqliteTable('substitutions', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  slotId: text('slotId').notNull().references(() => timetableSlots.id, { onDelete: 'cascade' }),
  originalTeacherId: text('originalTeacherId').notNull().references(() => staff.id),
  substituteTeacherId: text('substituteTeacherId').notNull().references(() => staff.id),
  date: text('date').notNull(),
  status: text('status').default('pending'), // pending, approved, completed
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
});

// --- Examination & Gradebook ---

export const exams = sqliteTable('exams', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  term: text('term'),
  startDate: text('startDate'),
  endDate: text('endDate'),
  status: text('status').default('scheduled'), // scheduled, ongoing, completed
  assignedClasses: text('assignedClasses'), // comma separated class IDs
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
});

export const examSchedule = sqliteTable('exam_schedule', {
  id: text('id').primaryKey(),
  examId: text('examId').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  subject: text('subject').notNull(),
  date: text('date').notNull(),
  startTime: text('startTime').notNull(),
  endTime: text('endTime').notNull(),
  roomId: text('roomId').references(() => rooms.id),
  totalMarks: integer('totalMarks').default(100),
});

export const marks = sqliteTable('marks', {
  id: text('id').primaryKey(),
  examScheduleId: text('examScheduleId').references(() => examSchedule.id, { onDelete: 'cascade' }),
  studentId: text('studentId').notNull().references(() => students.id, { onDelete: 'cascade' }),
  marksObtained: real('marksObtained'),
  totalMarks: integer('totalMarks'),
  grade: text('grade'),
  comments: text('comments'),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});

export const gradingRules = sqliteTable('grading_rules', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  systemType: text('systemType').notNull(), // Percentage, GPA, IB, etc.
  minScore: real('minScore').notNull(),
  maxScore: real('maxScore').notNull(),
  grade: text('grade').notNull(),
  points: real('points'),
});

export const questionBank = sqliteTable('question_bank', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  subject: text('subject').notNull(),
  question: text('question').notNull(),
  options: text('options'), // JSON string for MCQs
  answer: text('answer'),
  difficulty: text('difficulty'), // easy, medium, hard
  type: text('type').default('mcq'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
});

export const assessments = sqliteTable('assessments', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  classId: text('classId').references(() => classes.id),
  teacherId: text('teacherId').references(() => staff.id),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: text('dueDate'),
  totalMarks: integer('totalMarks'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
});

export const homework = sqliteTable('homework', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  classId: text('classId').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  subject: text('subject').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: text('dueDate'),
  teacherId: text('teacherId').references(() => staff.id),
  attachments: text('attachments'), // JSON string of URLs or base64
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});

export const leaveRequests = sqliteTable('leave_requests', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('studentId').notNull().references(() => students.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  startDate: text('startDate').notNull(),
  endDate: text('endDate').notNull(),
  status: text('status').default('pending'), // pending, approved, rejected
  approvedBy: text('approvedBy').references(() => staff.id),
  teacherMessage: text('teacherMessage'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
});

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  userId: text('userId').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(), // attendance, homework, fee, exam, announcement
  isRead: integer('isRead', { mode: 'boolean' }).default(false),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
});

export const notificationPreferences = sqliteTable('notification_preferences', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  attendanceAlerts: integer('attendanceAlerts', { mode: 'boolean' }).default(true),
  homeworkAlerts: integer('homeworkAlerts', { mode: 'boolean' }).default(true),
  feeReminders: integer('feeReminders', { mode: 'boolean' }).default(true),
  announcements: integer('announcements', { mode: 'boolean' }).default(true),
});

export const homeworkSubmissions = sqliteTable('homework_submissions', {
  id: text('id').primaryKey(),
  homeworkId: text('homeworkId').notNull().references(() => homework.id, { onDelete: 'cascade' }),
  studentId: text('studentId').notNull().references(() => students.id, { onDelete: 'cascade' }),
  content: text('content'),
  attachments: text('attachments'), // JSON string of URLs
  status: text('status').default('submitted'), // submitted, late, reviewed
  teacherFeedback: text('teacherFeedback'),
  submittedAt: text('submittedAt').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  homeworkStudentIndex: uniqueIndex('homework_student_idx').on(table.homeworkId, table.studentId),
}));

export const feeTransactions = sqliteTable('fee_transactions', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('studentId').notNull().references(() => students.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  category: text('category').notNull(), // tuition, transport, activities
  razorpayOrderId: text('razorpayOrderId'),
  razorpayPaymentId: text('razorpayPaymentId'),
  status: text('status').notNull(), // pending, success, failed
  receiptUrl: text('receiptUrl'),
  gstAmount: real('gstAmount').default(0),
  invoiceNumber: text('invoiceNumber'),
  paymentMethod: text('paymentMethod'),
  breakdown: text('breakdown'), // JSON string: { tuition: 5000, transport: 2000 }
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
});

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  participant1: text('participant1').notNull().references(() => users.uid),
  participant2: text('participant2').notNull().references(() => users.uid),
  lastMessage: text('lastMessage'),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversationId').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: text('senderId').notNull().references(() => users.uid),
  content: text('content').notNull(),
  fileUrl: text('fileUrl'),
  fileType: text('fileType'), // 'image', 'video', 'audio', 'document'
  isRead: integer('isRead', { mode: 'boolean' }).default(false),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
});

export const skillAssessments = sqliteTable('skill_assessments', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('studentId').notNull().references(() => students.id, { onDelete: 'cascade' }),
  sportId: text('sportId'), // Link to sport if applicable
  skill: text('skill').notNull(), 
  score: integer('score').notNull(), // 1-5 scale
  assessedBy: text('assessedBy').references(() => staff.id),
  comments: text('comments'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
});

export const sports = sqliteTable('sports', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // Football, Basketball
  coachId: text('coachId').references(() => staff.id),
  description: text('description'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
});

export const sportsEnrollments = sqliteTable('sports_enrollments', {
  id: text('id').primaryKey(),
  studentId: text('studentId').notNull().references(() => students.id, { onDelete: 'cascade' }),
  sportId: text('sportId').notNull().references(() => sports.id, { onDelete: 'cascade' }),
  joinedAt: text('joinedAt').default(sql`CURRENT_TIMESTAMP`),
});

export const trainingLogs = sqliteTable('training_logs', {
  id: text('id').primaryKey(),
  studentId: text('studentId').notNull().references(() => students.id, { onDelete: 'cascade' }),
  sportId: text('sportId').notNull().references(() => sports.id, { onDelete: 'cascade' }),
  duration: integer('duration'), // minutes
  intensity: integer('intensity'), // 1-10
  loadScore: real('loadScore'),
  notes: text('notes'),
  date: text('date').notNull(),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
});

export const fixtures = sqliteTable('fixtures', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  sportId: text('sportId').notNull().references(() => sports.id, { onDelete: 'cascade' }),
  opponentName: text('opponentName').notNull(),
  venue: text('venue').notNull(),
  locationUrl: text('locationUrl'), // Google Maps link
  dateTime: text('dateTime').notNull(),
  departureTime: text('departureTime'),
  status: text('status').default('scheduled'), // scheduled, ongoing, completed
  score: text('score'), // e.g., "2-1"
  result: text('result'), // win, loss, draw
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});

export const medicalRecords = sqliteTable('medical_records', {
  id: text('id').primaryKey(),
  studentId: text('studentId').notNull().references(() => students.id, { onDelete: 'cascade' }),
  bmi: real('bmi'),
  staminaScore: integer('staminaScore'),
  sprintTime: real('sprintTime'), // in seconds
  medicalFlags: text('medicalFlags'), // JSON: ["asthma", "allergy"]
  medications: text('medications'),
  emergencyContact: text('emergencyContact'),
  wearableData: text('wearableData'), // JSON for Garmin/Fitbit sync
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});

export const inventory = sqliteTable('inventory', {
  id: text('id').primaryKey(),
  schoolId: text('schoolId').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  itemName: text('itemName').notNull(),
  category: text('category').notNull(), // Kit, Equipment, Gear
  totalQuantity: integer('totalQuantity').notNull(),
  availableQuantity: integer('availableQuantity').notNull(),
  lowStockAlert: integer('lowStockAlert').default(5),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});

export const inventoryTransactions = sqliteTable('inventory_transactions', {
  id: text('id').primaryKey(),
  inventoryId: text('inventoryId').notNull().references(() => inventory.id, { onDelete: 'cascade' }),
  studentId: text('studentId').references(() => students.id),
  type: text('type').notNull(), // checkout, checkin
  quantity: integer('quantity').notNull(),
  signature: text('signature'), // Base64 signature
  status: text('status').default('active'), // active, returned, lost
  fineAmount: integer('fineAmount').default(0),
  transactionDate: text('transactionDate').default(sql`CURRENT_TIMESTAMP`),
});

export const aiFlags = sqliteTable('ai_flags', {
  id: text('id').primaryKey(),
  studentId: text('studentId').notNull().references(() => students.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // performance_drop, attendance_drop
  message: text('message').notNull(),
  severity: text('severity').default('medium'),
  isResolved: integer('isResolved', { mode: 'boolean' }).default(false),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
});

// --- Relations ---

export const timetableRelations = relations(timetable, ({ many, one }) => ({
  slots: many(timetableSlots),
  class: one(classes, {
    fields: [timetable.classId],
    references: [classes.id],
  }),
}));

export const timetableSlotRelations = relations(timetableSlots, ({ one }) => ({
  timetable: one(timetable, {
    fields: [timetableSlots.timetableId],
    references: [timetable.id],
  }),
  teacher: one(staff, {
    fields: [timetableSlots.teacherId],
    references: [staff.id],
  }),
  room: one(rooms, {
    fields: [timetableSlots.roomId],
    references: [rooms.id],
  }),
}));

export const examRelations = relations(exams, ({ many }) => ({
  schedules: many(examSchedule),
}));

export const examScheduleRelations = relations(examSchedule, ({ one, many }) => ({
  exam: one(exams, {
    fields: [examSchedule.examId],
    references: [exams.id],
  }),
  marks: many(marks),
}));

export const marksRelations = relations(marks, ({ one }) => ({
  examSchedule: one(examSchedule, {
    fields: [marks.examScheduleId],
    references: [examSchedule.id],
  }),
  student: one(students, {
    fields: [marks.studentId],
    references: [students.id],
  }),
}));

export const studentRelations = relations(students, ({ one, many }) => ({
  school: one(schools, {
    fields: [students.schoolId],
    references: [schools.id],
  }),
  class: one(classes, {
    fields: [students.classId],
    references: [classes.id],
  }),
  leaves: many(leaveRequests),
  marks: many(marks),
  attendance: many(attendance),
  fees: many(fees),
  homeworkSubmissions: many(homeworkSubmissions),
}));

export const classRelations = relations(classes, ({ one, many }) => ({
  school: one(schools, {
    fields: [classes.schoolId],
    references: [schools.id],
  }),
  students: many(students),
  assignments: many(teacherClassAssignments),
  timetables: many(timetable),
}));

export const leaveRequestRelations = relations(leaveRequests, ({ one }) => ({
  student: one(students, {
    fields: [leaveRequests.studentId],
    references: [students.id],
  }),
  teacher: one(staff, {
    fields: [leaveRequests.approvedBy],
    references: [staff.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(students, {
    fields: [attendance.studentId],
    references: [students.id],
  }),
  staff: one(staff, {
    fields: [attendance.staffId],
    references: [staff.id],
  }),
  class: one(classes, {
    fields: [attendance.classId],
    references: [classes.id],
  }),
}));

export const homeworkRelations = relations(homework, ({ one, many }) => ({
  class: one(classes, {
    fields: [homework.classId],
    references: [classes.id],
  }),
  teacher: one(staff, {
    fields: [homework.teacherId],
    references: [staff.id],
  }),
  submissions: many(homeworkSubmissions),
}));

export const homeworkSubmissionsRelations = relations(homeworkSubmissions, ({ one }) => ({
  homework: one(homework, {
    fields: [homeworkSubmissions.homeworkId],
    references: [homework.id],
  }),
  student: one(students, {
    fields: [homeworkSubmissions.studentId],
    references: [students.id],
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

export const feeTransactionsRelations = relations(feeTransactions, ({ one }) => ({
  student: one(students, {
    fields: [feeTransactions.studentId],
    references: [students.id],
  }),
  school: one(schools, {
    fields: [feeTransactions.schoolId],
    references: [schools.id],
  }),
}));
