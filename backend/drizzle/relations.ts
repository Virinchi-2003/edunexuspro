import { relations } from "drizzle-orm/relations";
import { schools, users, subscriptions, principals, classes, students, admissions, rooms, timetable, timetableSlots, staff, substitutions, exams, examSchedule, marks, gradingRules, questionBank, assessments, teacherClassAssignments, conversations, messages, sports, trophies, announcements, measurements } from "./schema";

export const usersRelations = relations(users, ({one, many}) => ({
	school: one(schools, {
		fields: [users.schoolId],
		references: [schools.id]
	}),
	conversations_participant2: many(conversations, {
		relationName: "conversations_participant2_users_uid"
	}),
	conversations_participant1: many(conversations, {
		relationName: "conversations_participant1_users_uid"
	}),
	messages: many(messages),
	announcements: many(announcements),
}));

export const schoolsRelations = relations(schools, ({many}) => ({
	users: many(users),
	subscriptions: many(subscriptions),
	principals: many(principals),
	admissions: many(admissions),
	rooms: many(rooms),
	timetables: many(timetable),
	substitutions: many(substitutions),
	exams: many(exams),
	gradingRules: many(gradingRules),
	questionBanks: many(questionBank),
	assessments: many(assessments),
	conversations: many(conversations),
	trophies: many(trophies),
	announcements: many(announcements),
	measurements: many(measurements),
}));

export const subscriptionsRelations = relations(subscriptions, ({one}) => ({
	school: one(schools, {
		fields: [subscriptions.schoolId],
		references: [schools.id]
	}),
}));

export const principalsRelations = relations(principals, ({one}) => ({
	school: one(schools, {
		fields: [principals.schoolId],
		references: [schools.id]
	}),
}));

export const studentsRelations = relations(students, ({one, many}) => ({
	class: one(classes, {
		fields: [students.classId],
		references: [classes.id]
	}),
	marks: many(marks),
	measurements: many(measurements),
}));

export const classesRelations = relations(classes, ({many}) => ({
	students: many(students),
	timetables: many(timetable),
	assessments: many(assessments),
	teacherClassAssignments: many(teacherClassAssignments),
}));

export const admissionsRelations = relations(admissions, ({one}) => ({
	school: one(schools, {
		fields: [admissions.schoolId],
		references: [schools.id]
	}),
}));

export const roomsRelations = relations(rooms, ({one, many}) => ({
	school: one(schools, {
		fields: [rooms.schoolId],
		references: [schools.id]
	}),
	timetableSlots: many(timetableSlots),
	examSchedules: many(examSchedule),
}));

export const timetableRelations = relations(timetable, ({one, many}) => ({
	class: one(classes, {
		fields: [timetable.classId],
		references: [classes.id]
	}),
	school: one(schools, {
		fields: [timetable.schoolId],
		references: [schools.id]
	}),
	timetableSlots: many(timetableSlots),
}));

export const timetableSlotsRelations = relations(timetableSlots, ({one, many}) => ({
	room: one(rooms, {
		fields: [timetableSlots.roomId],
		references: [rooms.id]
	}),
	staff: one(staff, {
		fields: [timetableSlots.teacherId],
		references: [staff.id]
	}),
	timetable: one(timetable, {
		fields: [timetableSlots.timetableId],
		references: [timetable.id]
	}),
	substitutions: many(substitutions),
}));

export const staffRelations = relations(staff, ({many}) => ({
	timetableSlots: many(timetableSlots),
	substitutions_substituteTeacherId: many(substitutions, {
		relationName: "substitutions_substituteTeacherId_staff_id"
	}),
	substitutions_originalTeacherId: many(substitutions, {
		relationName: "substitutions_originalTeacherId_staff_id"
	}),
	assessments: many(assessments),
	teacherClassAssignments: many(teacherClassAssignments),
	measurements: many(measurements),
}));

export const substitutionsRelations = relations(substitutions, ({one}) => ({
	staff_substituteTeacherId: one(staff, {
		fields: [substitutions.substituteTeacherId],
		references: [staff.id],
		relationName: "substitutions_substituteTeacherId_staff_id"
	}),
	staff_originalTeacherId: one(staff, {
		fields: [substitutions.originalTeacherId],
		references: [staff.id],
		relationName: "substitutions_originalTeacherId_staff_id"
	}),
	timetableSlot: one(timetableSlots, {
		fields: [substitutions.slotId],
		references: [timetableSlots.id]
	}),
	school: one(schools, {
		fields: [substitutions.schoolId],
		references: [schools.id]
	}),
}));

export const examsRelations = relations(exams, ({one, many}) => ({
	school: one(schools, {
		fields: [exams.schoolId],
		references: [schools.id]
	}),
	examSchedules: many(examSchedule),
}));

export const examScheduleRelations = relations(examSchedule, ({one, many}) => ({
	room: one(rooms, {
		fields: [examSchedule.roomId],
		references: [rooms.id]
	}),
	exam: one(exams, {
		fields: [examSchedule.examId],
		references: [exams.id]
	}),
	marks: many(marks),
}));

export const marksRelations = relations(marks, ({one}) => ({
	student: one(students, {
		fields: [marks.studentId],
		references: [students.id]
	}),
	examSchedule: one(examSchedule, {
		fields: [marks.examScheduleId],
		references: [examSchedule.id]
	}),
}));

export const gradingRulesRelations = relations(gradingRules, ({one}) => ({
	school: one(schools, {
		fields: [gradingRules.schoolId],
		references: [schools.id]
	}),
}));

export const questionBankRelations = relations(questionBank, ({one}) => ({
	school: one(schools, {
		fields: [questionBank.schoolId],
		references: [schools.id]
	}),
}));

export const assessmentsRelations = relations(assessments, ({one}) => ({
	staff: one(staff, {
		fields: [assessments.teacherId],
		references: [staff.id]
	}),
	class: one(classes, {
		fields: [assessments.classId],
		references: [classes.id]
	}),
	school: one(schools, {
		fields: [assessments.schoolId],
		references: [schools.id]
	}),
}));

export const teacherClassAssignmentsRelations = relations(teacherClassAssignments, ({one}) => ({
	class: one(classes, {
		fields: [teacherClassAssignments.classId],
		references: [classes.id]
	}),
	staff: one(staff, {
		fields: [teacherClassAssignments.teacherId],
		references: [staff.id]
	}),
}));

export const conversationsRelations = relations(conversations, ({one, many}) => ({
	user_participant2: one(users, {
		fields: [conversations.participant2],
		references: [users.uid],
		relationName: "conversations_participant2_users_uid"
	}),
	user_participant1: one(users, {
		fields: [conversations.participant1],
		references: [users.uid],
		relationName: "conversations_participant1_users_uid"
	}),
	school: one(schools, {
		fields: [conversations.schoolId],
		references: [schools.id]
	}),
	messages: many(messages),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	user: one(users, {
		fields: [messages.senderId],
		references: [users.uid]
	}),
	conversation: one(conversations, {
		fields: [messages.conversationId],
		references: [conversations.id]
	}),
}));

export const trophiesRelations = relations(trophies, ({one}) => ({
	sport: one(sports, {
		fields: [trophies.sportId],
		references: [sports.id]
	}),
	school: one(schools, {
		fields: [trophies.schoolId],
		references: [schools.id]
	}),
}));

export const sportsRelations = relations(sports, ({many}) => ({
	trophies: many(trophies),
}));

export const announcementsRelations = relations(announcements, ({one}) => ({
	user: one(users, {
		fields: [announcements.postedBy],
		references: [users.uid]
	}),
	school: one(schools, {
		fields: [announcements.schoolId],
		references: [schools.id]
	}),
}));

export const measurementsRelations = relations(measurements, ({one}) => ({
	staff: one(staff, {
		fields: [measurements.recordedBy],
		references: [staff.id]
	}),
	student: one(students, {
		fields: [measurements.studentId],
		references: [students.id]
	}),
	school: one(schools, {
		fields: [measurements.schoolId],
		references: [schools.id]
	}),
}));