import { turso } from '../config/database';
import dotenv from 'dotenv';
dotenv.config();

const statements = [
  `CREATE TABLE IF NOT EXISTS rooms (
    id text PRIMARY KEY NOT NULL,
    schoolId text NOT NULL,
    name text NOT NULL,
    capacity integer,
    type text DEFAULT 'classroom',
    status text DEFAULT 'available',
    createdAt text DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schoolId) REFERENCES schools(id) ON UPDATE no action ON DELETE cascade
  )`,
  `CREATE TABLE IF NOT EXISTS timetable (
    id text PRIMARY KEY NOT NULL,
    schoolId text NOT NULL,
    classId text NOT NULL,
    name text NOT NULL,
    isActive integer DEFAULT true,
    createdAt text DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schoolId) REFERENCES schools(id) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (classId) REFERENCES classes(id) ON UPDATE no action ON DELETE cascade
  )`,
  `CREATE TABLE IF NOT EXISTS timetable_slots (
    id text PRIMARY KEY NOT NULL,
    timetableId text NOT NULL,
    dayOfWeek text NOT NULL,
    startTime text NOT NULL,
    endTime text NOT NULL,
    subject text NOT NULL,
    teacherId text,
    roomId text,
    FOREIGN KEY (timetableId) REFERENCES timetable(id) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (teacherId) REFERENCES staff(id) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (roomId) REFERENCES rooms(id) ON UPDATE no action ON DELETE set null
  )`,
  `CREATE TABLE IF NOT EXISTS substitutions (
    id text PRIMARY KEY NOT NULL,
    schoolId text NOT NULL,
    slotId text NOT NULL,
    originalTeacherId text NOT NULL,
    substituteTeacherId text NOT NULL,
    date text NOT NULL,
    status text DEFAULT 'pending',
    createdAt text DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schoolId) REFERENCES schools(id) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (slotId) REFERENCES timetable_slots(id) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (originalTeacherId) REFERENCES staff(id) ON UPDATE no action ON DELETE no action,
    FOREIGN KEY (substituteTeacherId) REFERENCES staff(id) ON UPDATE no action ON DELETE no action
  )`,
  `CREATE TABLE IF NOT EXISTS exams (
    id text PRIMARY KEY NOT NULL,
    schoolId text NOT NULL,
    name text NOT NULL,
    term text,
    startDate text,
    endDate text,
    status text DEFAULT 'scheduled',
    createdAt text DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schoolId) REFERENCES schools(id) ON UPDATE no action ON DELETE cascade
  )`,
  `CREATE TABLE IF NOT EXISTS exam_schedule (
    id text PRIMARY KEY NOT NULL,
    examId text NOT NULL,
    subject text NOT NULL,
    date text NOT NULL,
    startTime text NOT NULL,
    endTime text NOT NULL,
    roomId text,
    totalMarks integer DEFAULT 100,
    FOREIGN KEY (examId) REFERENCES exams(id) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (roomId) REFERENCES rooms(id) ON UPDATE no action ON DELETE no action
  )`,
  `CREATE TABLE IF NOT EXISTS marks (
    id text PRIMARY KEY NOT NULL,
    examScheduleId text,
    studentId text NOT NULL,
    marksObtained real,
    totalMarks integer,
    grade text,
    comments text,
    updatedAt text DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (examScheduleId) REFERENCES exam_schedule(id) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (studentId) REFERENCES students(id) ON UPDATE no action ON DELETE cascade
  )`,
  `CREATE TABLE IF NOT EXISTS grading_rules (
    id text PRIMARY KEY NOT NULL,
    schoolId text NOT NULL,
    systemType text NOT NULL,
    minScore real NOT NULL,
    maxScore real NOT NULL,
    grade text NOT NULL,
    points real,
    FOREIGN KEY (schoolId) REFERENCES schools(id) ON UPDATE no action ON DELETE cascade
  )`,
  `CREATE TABLE IF NOT EXISTS question_bank (
    id text PRIMARY KEY NOT NULL,
    schoolId text NOT NULL,
    subject text NOT NULL,
    question text NOT NULL,
    options text,
    answer text,
    difficulty text,
    type text DEFAULT 'mcq',
    createdAt text DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schoolId) REFERENCES schools(id) ON UPDATE no action ON DELETE cascade
  )`,
  `CREATE TABLE IF NOT EXISTS assessments (
    id text PRIMARY KEY NOT NULL,
    schoolId text NOT NULL,
    classId text,
    teacherId text,
    title text NOT NULL,
    description text,
    dueDate text,
    totalMarks integer,
    createdAt text DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schoolId) REFERENCES schools(id) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (classId) REFERENCES classes(id) ON UPDATE no action ON DELETE no action,
    FOREIGN KEY (teacherId) REFERENCES staff(id) ON UPDATE no action ON DELETE no action
  )`
];

async function migrate() {
  console.log('🚀 Starting manual migration...');
  for (const sql of statements) {
    try {
      await turso.execute(sql);
      console.log('✅ Executed statement successfully.');
    } catch (error) {
      console.error('❌ Statement failed:', error);
    }
  }
  console.log('🏁 Migration finished.');
}

migrate();
