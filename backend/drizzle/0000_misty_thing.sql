CREATE TABLE `admissions` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`studentName` text NOT NULL,
	`parentName` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`grade` text NOT NULL,
	`address` text,
	`dateOfBirth` text,
	`gender` text,
	`aadhaarNumber` text,
	`bloodGroup` text,
	`previousSchool` text,
	`religion` text,
	`category` text,
	`documents` text,
	`studentId` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`appliedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`classId` text,
	`teacherId` text,
	`title` text NOT NULL,
	`description` text,
	`dueDate` text,
	`totalMarks` integer,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacherId`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`studentId` text,
	`staffId` text,
	`classId` text,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`remarks` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`name` text NOT NULL,
	`section` text NOT NULL,
	`roomNumber` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `configs` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `exam_schedule` (
	`id` text PRIMARY KEY NOT NULL,
	`examId` text NOT NULL,
	`subject` text NOT NULL,
	`date` text NOT NULL,
	`startTime` text NOT NULL,
	`endTime` text NOT NULL,
	`roomId` text,
	`totalMarks` integer DEFAULT 100,
	FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`name` text NOT NULL,
	`term` text,
	`startDate` text,
	`endDate` text,
	`status` text DEFAULT 'scheduled',
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `fee_structures` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`grade` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `fees` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`studentId` text NOT NULL,
	`amount` integer NOT NULL,
	`paidAmount` integer DEFAULT 0,
	`status` text DEFAULT 'unpaid',
	`dueDate` text,
	`paymentDate` text,
	`transactionId` text,
	`feeType` text DEFAULT 'Tuition Fee',
	`lateFee` integer DEFAULT 0,
	`gracePeriodDays` integer DEFAULT 5,
	`challanNumber` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `grading_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`systemType` text NOT NULL,
	`minScore` real NOT NULL,
	`maxScore` real NOT NULL,
	`grade` text NOT NULL,
	`points` real,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolName` text NOT NULL,
	`adminName` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`message` text,
	`reply` text,
	`adminNote` text,
	`plan` text,
	`paymentStatus` text DEFAULT 'pending',
	`status` text DEFAULT 'new',
	`createdAt` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `marks` (
	`id` text PRIMARY KEY NOT NULL,
	`examScheduleId` text,
	`studentId` text NOT NULL,
	`marksObtained` real,
	`totalMarks` integer,
	`grade` text,
	`comments` text,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`examScheduleId`) REFERENCES `exam_schedule`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `principals` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text,
	`phone` text NOT NULL,
	`userId` text,
	`status` text DEFAULT 'active',
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `principals_email_unique` ON `principals` (`email`);--> statement-breakpoint
CREATE TABLE `question_bank` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`subject` text NOT NULL,
	`question` text NOT NULL,
	`options` text,
	`answer` text,
	`difficulty` text,
	`type` text DEFAULT 'mcq',
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`name` text NOT NULL,
	`capacity` integer,
	`type` text DEFAULT 'classroom',
	`status` text DEFAULT 'available',
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`contactEmail` text NOT NULL,
	`subscriptionPlan` text NOT NULL,
	`status` text DEFAULT 'active',
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schools_school_id_unique` ON `schools` (`school_id`);--> statement-breakpoint
CREATE TABLE `staff` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`userId` text,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text,
	`dob` text,
	`department` text NOT NULL,
	`role` text NOT NULL,
	`subjects` text,
	`classes` text,
	`branch` text,
	`salary` integer,
	`joiningDate` text DEFAULT CURRENT_TIMESTAMP,
	`status` text DEFAULT 'active',
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`classId` text,
	`studentId` text NOT NULL,
	`name` text NOT NULL,
	`parentName` text,
	`email` text,
	`phone` text,
	`password` text,
	`grade` text NOT NULL,
	`section` text,
	`status` text DEFAULT 'active',
	`userId` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `students_studentId_unique` ON `students` (`studentId`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`plan` text NOT NULL,
	`status` text NOT NULL,
	`startDate` text NOT NULL,
	`endDate` text NOT NULL,
	`amount` real NOT NULL,
	`transactionId` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `substitutions` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`slotId` text NOT NULL,
	`originalTeacherId` text NOT NULL,
	`substituteTeacherId` text NOT NULL,
	`date` text NOT NULL,
	`status` text DEFAULT 'pending',
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`slotId`) REFERENCES `timetable_slots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`originalTeacherId`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`substituteTeacherId`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `timetable` (
	`id` text PRIMARY KEY NOT NULL,
	`schoolId` text NOT NULL,
	`classId` text NOT NULL,
	`name` text NOT NULL,
	`isActive` integer DEFAULT true,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `timetable_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`timetableId` text NOT NULL,
	`dayOfWeek` text NOT NULL,
	`startTime` text NOT NULL,
	`endTime` text NOT NULL,
	`subject` text NOT NULL,
	`teacherId` text,
	`roomId` text,
	FOREIGN KEY (`timetableId`) REFERENCES `timetable`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacherId`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`roomId`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `users` (
	`uid` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`phoneNumber` text,
	`password` text,
	`role` text NOT NULL,
	`schoolId` text,
	`emailAlerts` integer DEFAULT true,
	`smsAlerts` integer DEFAULT false,
	`darkMode` integer DEFAULT false,
	`language` text DEFAULT 'English',
	`status` text DEFAULT 'active',
	`createdAt` text DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);