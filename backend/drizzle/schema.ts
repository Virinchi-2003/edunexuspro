import { sqliteTable, AnySQLiteColumn, text, uniqueIndex, foreignKey, integer, real } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const schools = sqliteTable("schools", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	address: text().notNull(),
	contactEmail: text().notNull(),
	subscriptionPlan: text().notNull(),
	status: text().default("active"),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	schoolId: text("school_id"),
	currentAcademicYear: text().default("sql`("2026-27")`"),
});

export const users = sqliteTable("users", {
	uid: text().primaryKey().notNull(),
	email: text().notNull(),
	role: text().notNull(),
	schoolId: text().references(() => schools.id, { onDelete: "set null" } ),
	status: text().default("active"),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	name: text(),
	phoneNumber: text(),
	updatedAt: text(),
	password: text(),
	emailAlerts: integer().default(0),
	smsAlerts: integer().default(0),
	darkMode: integer().default(0),
	language: text().default("English"),
	photoUrl: text(),
	resetPasswordToken: text(),
	resetPasswordExpires: text(),
},
(table) => [
	uniqueIndex("users_email_unique").on(table.email),
]);

export const subscriptions = sqliteTable("subscriptions", {
	id: text().primaryKey().notNull(),
	schoolId: text().notNull().references(() => schools.id, { onDelete: "cascade" } ),
	plan: text().notNull(),
	status: text().notNull(),
	startDate: text().notNull(),
	endDate: text().notNull(),
	amount: real().notNull(),
	transactionId: text(),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const principals = sqliteTable("principals", {
	id: text().primaryKey().notNull(),
	schoolId: text().notNull().references(() => schools.id, { onDelete: "cascade" } ),
	name: text().notNull(),
	email: text().notNull(),
	phone: text().notNull(),
	userId: text(),
	status: text().default("active"),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	password: text(),
},
(table) => [
	uniqueIndex("principals_email_unique").on(table.email),
]);

export const leads = sqliteTable("leads", {
	id: text().primaryKey().notNull(),
	schoolName: text().notNull(),
	adminName: text().notNull(),
	email: text().notNull(),
	phone: text().notNull(),
	message: text(),
	status: text().default("new"),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	reply: text(),
	adminNote: text(),
	plan: text(),
	paymentStatus: text().default("pending"),
});

export const configs = sqliteTable("configs", {
	key: text().primaryKey(),
	value: text().notNull(),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const students = sqliteTable("students", {
	id: text().primaryKey(),
	schoolId: text().notNull(),
	studentId: text().notNull(),
	name: text().notNull(),
	parentName: text(),
	email: text(),
	phone: text(),
	password: text(),
	grade: text().notNull(),
	section: text(),
	status: text().default("active"),
	userId: text(),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	classId: text().references(() => classes.id),
	photoUrl: text(),
});

export const classes = sqliteTable("classes", {
	id: text().primaryKey(),
	schoolId: text().notNull(),
	name: text().notNull(),
	section: text().notNull(),
	roomNumber: text(),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const staff = sqliteTable("staff", {
	id: text().primaryKey(),
	schoolId: text().notNull(),
	userId: text(),
	name: text().notNull(),
	email: text().notNull(),
	password: text(),
	dob: text(),
	department: text().notNull(),
	role: text().notNull(),
	subjects: text(),
	classes: text(),
	branch: text(),
	salary: integer(),
	joiningDate: text().default("sql`(CURRENT_TIMESTAMP)`"),
	status: text().default("active"),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	photoUrl: text(),
});

export const fees = sqliteTable("fees", {
	id: text().primaryKey(),
	schoolId: text().notNull(),
	studentId: text().notNull(),
	amount: integer().notNull(),
	paidAmount: integer().default(0),
	status: text().default("unpaid"),
	dueDate: text(),
	paymentDate: text(),
	transactionId: text(),
	feeType: text().default("Tuition Fee"),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	lateFee: integer().default(0),
	gracePeriodDays: integer().default(5),
	challanNumber: text(),
	academicYear: text().default("sql`("2026-27")`"),
	breakdown: text(),
});

export const attendance = sqliteTable("attendance", {
	id: text().primaryKey(),
	schoolId: text().notNull(),
	studentId: text(),
	staffId: text(),
	classId: text(),
	date: text().notNull(),
	status: text().notNull(),
	remarks: text(),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	academicYear: text().default("sql`("2026-27")`"),
});

export const admissions = sqliteTable("admissions", {
	id: text().primaryKey(),
	schoolId: text().notNull().references(() => schools.id, { onDelete: "cascade" } ),
	studentName: text().notNull(),
	parentName: text().notNull(),
	email: text().notNull(),
	phone: text().notNull(),
	grade: text().notNull(),
	address: text(),
	dateOfBirth: text(),
	gender: text(),
	aadhaarNumber: text(),
	documents: text(),
	status: text().default("pending"),
	appliedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	bloodGroup: text(),
	previousSchool: text(),
	religion: text(),
	category: text(),
	studentId: text(),
});

export const feeStructures = sqliteTable("fee_structures", {
	id: text().primaryKey(),
	schoolId: text().notNull(),
	grade: text().notNull(),
	amount: integer().notNull(),
	description: text(),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	tuitionFees: integer().default(0),
	transportFees: integer().default(0),
	libraryFees: integer().default(0),
	examFees: integer().default(0),
	activityFees: integer().default(0),
	otherFees: integer().default(0),
});

export const rooms = sqliteTable("rooms", {
	id: text().primaryKey().notNull(),
	schoolId: text().notNull().references(() => schools.id, { onDelete: "cascade" } ),
	name: text().notNull(),
	capacity: integer(),
	type: text().default("classroom"),
	status: text().default("available"),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const timetable = sqliteTable("timetable", {
	id: text().primaryKey().notNull(),
	schoolId: text().notNull().references(() => schools.id, { onDelete: "cascade" } ),
	classId: text().notNull().references(() => classes.id, { onDelete: "cascade" } ),
	name: text().notNull(),
	isActive: integer().default(true),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const timetableSlots = sqliteTable("timetable_slots", {
	id: text().primaryKey().notNull(),
	timetableId: text().notNull().references(() => timetable.id, { onDelete: "cascade" } ),
	dayOfWeek: text().notNull(),
	startTime: text().notNull(),
	endTime: text().notNull(),
	subject: text().notNull(),
	teacherId: text().references(() => staff.id, { onDelete: "set null" } ),
	roomId: text().references(() => rooms.id, { onDelete: "set null" } ),
});

export const substitutions = sqliteTable("substitutions", {
	id: text().primaryKey().notNull(),
	schoolId: text().notNull().references(() => schools.id, { onDelete: "cascade" } ),
	slotId: text().notNull().references(() => timetableSlots.id, { onDelete: "cascade" } ),
	originalTeacherId: text().notNull().references(() => staff.id),
	substituteTeacherId: text().notNull().references(() => staff.id),
	date: text().notNull(),
	status: text().default("pending"),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const exams = sqliteTable("exams", {
	id: text().primaryKey().notNull(),
	schoolId: text().notNull().references(() => schools.id, { onDelete: "cascade" } ),
	name: text().notNull(),
	term: text(),
	startDate: text(),
	endDate: text(),
	status: text().default("scheduled"),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	assignedClasses: text(),
});

export const examSchedule = sqliteTable("exam_schedule", {
	id: text().primaryKey().notNull(),
	examId: text().notNull().references(() => exams.id, { onDelete: "cascade" } ),
	subject: text().notNull(),
	date: text().notNull(),
	startTime: text().notNull(),
	endTime: text().notNull(),
	roomId: text().references(() => rooms.id),
	totalMarks: integer().default(100),
});

export const marks = sqliteTable("marks", {
	id: text().primaryKey().notNull(),
	examScheduleId: text().references(() => examSchedule.id, { onDelete: "cascade" } ),
	studentId: text().notNull().references(() => students.id, { onDelete: "cascade" } ),
	marksObtained: real(),
	totalMarks: integer(),
	grade: text(),
	comments: text(),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const gradingRules = sqliteTable("grading_rules", {
	id: text().primaryKey().notNull(),
	schoolId: text().notNull().references(() => schools.id, { onDelete: "cascade" } ),
	systemType: text().notNull(),
	minScore: real().notNull(),
	maxScore: real().notNull(),
	grade: text().notNull(),
	points: real(),
});

export const questionBank = sqliteTable("question_bank", {
	id: text().primaryKey().notNull(),
	schoolId: text().notNull().references(() => schools.id, { onDelete: "cascade" } ),
	subject: text().notNull(),
	question: text().notNull(),
	options: text(),
	answer: text(),
	difficulty: text(),
	type: text().default("mcq"),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const assessments = sqliteTable("assessments", {
	id: text().primaryKey().notNull(),
	schoolId: text().notNull().references(() => schools.id, { onDelete: "cascade" } ),
	classId: text().references(() => classes.id),
	teacherId: text().references(() => staff.id),
	title: text().notNull(),
	description: text(),
	dueDate: text(),
	totalMarks: integer(),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const teacherClassAssignments = sqliteTable("teacher_class_assignments", {
	id: text().primaryKey(),
	teacherId: text().notNull().references(() => staff.id, { onDelete: "cascade" } ),
	classId: text().notNull().references(() => classes.id, { onDelete: "cascade" } ),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const leaveRequests = sqliteTable("leave_requests", {
	id: text().primaryKey(),
	schoolId: text().notNull(),
	studentId: text().notNull(),
	reason: text().notNull(),
	startDate: text().notNull(),
	endDate: text().notNull(),
	status: text().default("pending"),
	approvedBy: text(),
	teacherMessage: text(),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	aiStatus: text(),
	aiReason: text(),
	aiConfidence: real(),
	updatedAt: text(),
});

export const homework = sqliteTable("homework", {
	id: text().primaryKey(),
	schoolId: text().notNull(),
	classId: text().notNull(),
	subject: text().notNull(),
	title: text().notNull(),
	description: text(),
	dueDate: text(),
	teacherId: text(),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	attachments: text(),
});

export const homeworkSubmissions = sqliteTable("homework_submissions", {
	id: text().primaryKey(),
	homeworkId: text().notNull(),
	studentId: text().notNull(),
	content: text(),
	attachments: text(),
	status: text().default("submitted"),
	teacherFeedback: text(),
	submittedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
},
(table) => [
	uniqueIndex("homework_student_idx").on(table.homeworkId, table.studentId),
]);

export const feeTransactions = sqliteTable("fee_transactions", {
	id: text().primaryKey(),
	schoolId: text().notNull(),
	studentId: text().notNull(),
	amount: real().notNull(),
	category: text().notNull(),
	razorpayOrderId: text(),
	razorpayPaymentId: text(),
	status: text().notNull(),
	receiptUrl: text(),
	gstAmount: real(),
	invoiceNumber: text(),
	paymentMethod: text(),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	breakdown: text(),
});

export const conversations = sqliteTable("conversations", {
	id: text().primaryKey(),
	schoolId: text().notNull().references(() => schools.id, { onDelete: "cascade" } ),
	participant1: text().notNull().references(() => users.uid),
	participant2: text().notNull().references(() => users.uid),
	lastMessage: text(),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const messages = sqliteTable("messages", {
	id: text().primaryKey(),
	conversationId: text().notNull().references(() => conversations.id, { onDelete: "cascade" } ),
	senderId: text().notNull().references(() => users.uid),
	content: text().notNull(),
	isRead: integer().default(0),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	fileUrl: text(),
	fileType: text(),
});

export const skillAssessments = sqliteTable("skill_assessments", {
	id: text().primaryKey().notNull(),
	schoolId: text().notNull(),
	studentId: text().notNull(),
	sportId: text(),
	skill: text().notNull(),
	score: integer().notNull(),
	assessedBy: text(),
	comments: text(),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const sports = sqliteTable("sports", {
	id: text().primaryKey().notNull(),
	schoolId: text().notNull(),
	name: text().notNull(),
	coachId: text(),
	description: text(),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const sportsEnrollments = sqliteTable("sports_enrollments", {
	id: text().primaryKey().notNull(),
	studentId: text().notNull(),
	sportId: text().notNull(),
	joinedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const trainingLogs = sqliteTable("training_logs", {
	id: text().primaryKey().notNull(),
	studentId: text().notNull(),
	sportId: text().notNull(),
	duration: integer(),
	intensity: integer(),
	loadScore: real(),
	notes: text(),
	date: text().notNull(),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const fixtures = sqliteTable("fixtures", {
	id: text().primaryKey().notNull(),
	schoolId: text().notNull(),
	sportId: text().notNull(),
	opponentName: text().notNull(),
	venue: text().notNull(),
	locationUrl: text(),
	dateTime: text().notNull(),
	departureTime: text(),
	status: text().default("scheduled"),
	score: text(),
	result: text(),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const medicalRecords = sqliteTable("medical_records", {
	id: text().primaryKey().notNull(),
	studentId: text().notNull(),
	bmi: real(),
	staminaScore: integer(),
	sprintTime: real(),
	medicalFlags: text(),
	medications: text(),
	emergencyContact: text(),
	wearableData: text(),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const inventory = sqliteTable("inventory", {
	id: text().primaryKey().notNull(),
	schoolId: text().notNull(),
	itemName: text().notNull(),
	category: text().notNull(),
	totalQuantity: integer().notNull(),
	availableQuantity: integer().notNull(),
	lowStockAlert: integer().default(5),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const inventoryTransactions = sqliteTable("inventory_transactions", {
	id: text().primaryKey().notNull(),
	inventoryId: text().notNull(),
	studentId: text(),
	type: text().notNull(),
	quantity: integer().notNull(),
	signature: text(),
	status: text().default("active"),
	fineAmount: integer().default(0),
	transactionDate: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const aiFlags = sqliteTable("ai_flags", {
	id: text().primaryKey().notNull(),
	studentId: text().notNull(),
	type: text().notNull(),
	message: text().notNull(),
	severity: text().default("medium"),
	isResolved: integer().default(0),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const requisitions = sqliteTable("requisitions", {
	id: text().primaryKey(),
	schoolId: text().notNull(),
	itemName: text().notNull(),
	quantity: integer().notNull(),
	priority: text().default("medium"),
	reason: text(),
	status: text().default("pending"),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const trophies = sqliteTable("trophies", {
	id: text().primaryKey(),
	schoolId: text().notNull().references(() => schools.id),
	sportId: text().references(() => sports.id),
	tournamentName: text().notNull(),
	awardTitle: text().notNull(),
	year: text().notNull(),
	photoUrl: text(),
	description: text(),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const salaryPayments = sqliteTable("salary_payments", {
	id: text().primaryKey(),
	schoolId: text().notNull(),
	staffId: text().notNull(),
	amount: integer().notNull(),
	bonus: integer().default(0),
	deductions: integer().default(0),
	month: text().notNull(),
	paymentDate: text().default("sql`(CURRENT_TIMESTAMP)`"),
	status: text().default("paid"),
	transactionId: text(),
	notes: text(),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text(),
});

export const supportTickets = sqliteTable("support_tickets", {
	id: text().primaryKey(),
	schoolId: text().notNull(),
	studentId: text(),
	staffId: text(),
	subject: text().notNull(),
	message: text().notNull(),
	category: text().notNull(),
	priority: text().default("medium"),
	status: text().default("open"),
	assignedTo: text(),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const announcements = sqliteTable("announcements", {
	id: text().primaryKey(),
	schoolId: text().notNull().references(() => schools.id, { onDelete: "cascade" } ),
	title: text().notNull(),
	content: text().notNull(),
	type: text().default("notice"),
	priority: text().default("medium"),
	attachmentUrl: text(),
	attachmentName: text(),
	postedBy: text().references(() => users.uid),
	postedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const payrollApprovals = sqliteTable("payroll_approvals", {
	id: text().primaryKey(),
	schoolId: text().notNull(),
	month: text().notNull(),
	status: text().default("pending"),
	approvedBy: text(),
	approvedAt: text(),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const measurements = sqliteTable("measurements", {
	id: text().primaryKey(),
	schoolId: text().notNull().references(() => schools.id, { onDelete: "cascade" } ),
	studentId: text().notNull().references(() => students.id, { onDelete: "cascade" } ),
	height: real(),
	weight: real(),
	bmi: real(),
	fatPercentage: real(),
	muscleMass: real(),
	chest: real(),
	waist: real(),
	recordedBy: text().references(() => staff.id),
	notes: text(),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const wallets = sqliteTable("wallets", {
	id: text().primaryKey(),
	schoolId: text().notNull(),
	studentId: text().notNull(),
	balance: real(),
	status: text().default("active"),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const walletTransactions = sqliteTable("wallet_transactions", {
	id: text().primaryKey(),
	schoolId: text().notNull(),
	studentId: text().notNull(),
	walletId: text().notNull(),
	amount: real().notNull(),
	type: text().notNull(),
	category: text().default("others"),
	vendor: text(),
	description: text(),
	status: text().default("success"),
	timestamp: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text(),
});

export const walletLimits = sqliteTable("wallet_limits", {
	studentId: text().primaryKey(),
	dailyLimit: real().default(500),
	weeklyLimit: real().default(2000),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const rechargeLogs = sqliteTable("recharge_logs", {
	id: text().primaryKey(),
	schoolId: text().notNull(),
	studentId: text().notNull(),
	parentId: text(),
	amount: real().notNull(),
	transactionId: text(),
	status: text().default("pending"),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text(),
});

