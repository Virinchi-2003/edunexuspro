CREATE TABLE `ai_flags` (
	`id` text PRIMARY KEY NOT NULL,
	`studentId` text NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`severity` text DEFAULT 'medium',
	`isResolved` integer DEFAULT false,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`participant1` text NOT NULL,
	`participant2` text NOT NULL,
	`lastMessage` text,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`participant1`) REFERENCES `users`(`uid`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`participant2`) REFERENCES `users`(`uid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `fee_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`studentId` text NOT NULL,
	`amount` real NOT NULL,
	`category` text NOT NULL,
	`razorpayOrderId` text,
	`razorpayPaymentId` text,
	`status` text NOT NULL,
	`receiptUrl` text,
	`gstAmount` real DEFAULT 0,
	`invoiceNumber` text,
	`paymentMethod` text,
	`breakdown` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `fixtures` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`sportId` text NOT NULL,
	`opponentName` text NOT NULL,
	`venue` text NOT NULL,
	`locationUrl` text,
	`dateTime` text NOT NULL,
	`departureTime` text,
	`status` text DEFAULT 'scheduled',
	`score` text,
	`result` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sportId`) REFERENCES `sports`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `homework` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`classId` text NOT NULL,
	`subject` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`dueDate` text,
	`teacherId` text,
	`attachments` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacherId`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `homework_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`homeworkId` text NOT NULL,
	`studentId` text NOT NULL,
	`content` text,
	`attachments` text,
	`status` text DEFAULT 'submitted',
	`teacherFeedback` text,
	`submittedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`homeworkId`) REFERENCES `homework`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `homework_student_idx` ON `homework_submissions` (`homeworkId`,`studentId`);--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`itemName` text NOT NULL,
	`category` text NOT NULL,
	`totalQuantity` integer NOT NULL,
	`availableQuantity` integer NOT NULL,
	`lowStockAlert` integer DEFAULT 5,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `inventory_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`inventoryId` text NOT NULL,
	`studentId` text,
	`type` text NOT NULL,
	`quantity` integer NOT NULL,
	`signature` text,
	`status` text DEFAULT 'active',
	`fineAmount` integer DEFAULT 0,
	`transactionDate` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`inventoryId`) REFERENCES `inventory`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `leave_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`studentId` text NOT NULL,
	`reason` text NOT NULL,
	`startDate` text NOT NULL,
	`endDate` text NOT NULL,
	`status` text DEFAULT 'pending',
	`approvedBy` text,
	`teacherMessage` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`approvedBy`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `medical_records` (
	`id` text PRIMARY KEY NOT NULL,
	`studentId` text NOT NULL,
	`bmi` real,
	`staminaScore` integer,
	`sprintTime` real,
	`medicalFlags` text,
	`medications` text,
	`emergencyContact` text,
	`wearableData` text,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversationId` text NOT NULL,
	`senderId` text NOT NULL,
	`content` text NOT NULL,
	`fileUrl` text,
	`fileType` text,
	`isRead` integer DEFAULT false,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`senderId`) REFERENCES `users`(`uid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`attendanceAlerts` integer DEFAULT true,
	`homeworkAlerts` integer DEFAULT true,
	`feeReminders` integer DEFAULT true,
	`announcements` integer DEFAULT true,
	FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`userId` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`type` text NOT NULL,
	`isRead` integer DEFAULT false,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `skill_assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`studentId` text NOT NULL,
	`sportId` text,
	`skill` text NOT NULL,
	`score` integer NOT NULL,
	`assessedBy` text,
	`comments` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assessedBy`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sports` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`name` text NOT NULL,
	`coachId` text,
	`description` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`coachId`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sports_enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`studentId` text NOT NULL,
	`sportId` text NOT NULL,
	`joinedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sportId`) REFERENCES `sports`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `teacher_class_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`teacherId` text NOT NULL,
	`classId` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`teacherId`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `training_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`studentId` text NOT NULL,
	`sportId` text NOT NULL,
	`duration` integer,
	`intensity` integer,
	`loadScore` real,
	`notes` text,
	`date` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sportId`) REFERENCES `sports`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `attendance` ADD `academicYear` text DEFAULT '2026-27';--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_idx` ON `attendance` (`schoolId`,`studentId`,`staffId`,`date`);--> statement-breakpoint
ALTER TABLE `exams` ADD `assignedClasses` text;--> statement-breakpoint
ALTER TABLE `fee_structures` ADD `tuitionFees` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `fee_structures` ADD `transportFees` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `fee_structures` ADD `libraryFees` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `fee_structures` ADD `examFees` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `fee_structures` ADD `activityFees` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `fee_structures` ADD `otherFees` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `fees` ADD `academicYear` text DEFAULT '2026-27';--> statement-breakpoint
ALTER TABLE `fees` ADD `breakdown` text;--> statement-breakpoint
ALTER TABLE `schools` ADD `currentAcademicYear` text DEFAULT '2026-27';--> statement-breakpoint
ALTER TABLE `staff` ADD `photoURL` text;--> statement-breakpoint
ALTER TABLE `students` ADD `photoURL` text;--> statement-breakpoint
ALTER TABLE `users` ADD `photoURL` text;