import { Request, Response } from 'express';
import { db } from '../config/database';
import { admissions, students, users, schools } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, desc } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';
import { sendAdmissionEmail } from '../services/emailService';

export const createAdmission = asyncHandler(async (req: Request, res: Response) => {
  const { 
    schoolId, studentName, parentName, email, phone, grade, 
    address, dateOfBirth, gender, aadhaarNumber,
    bloodGroup, previousSchool, religion, category, documents,
    fatherOccupation, motherName, motherOccupation, annualIncome
  } = req.body;
  
  const id = `APP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  const admissionData = {
    id,
    schoolId,
    studentName,
    parentName,
    email,
    phone,
    grade,
    address,
    dateOfBirth,
    gender,
    aadhaarNumber,
    bloodGroup,
    previousSchool,
    religion,
    category,
    fatherOccupation,
    motherName,
    motherOccupation,
    annualIncome,
    documents: documents ? (typeof documents === 'string' ? documents : JSON.stringify(documents)) : null,
    status: 'pending' as const,
  };

  await db.insert(admissions).values(admissionData);

  res.status(201).json({ status: 'success', data: admissionData });
});

export const getAdmissionsBySchool = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.admissions.findMany({
    where: eq(admissions.schoolId, schoolId),
    orderBy: [desc(admissions.appliedAt)]
  });
  res.status(200).json({ status: 'success', data: result });
});

export const updateAdmissionStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const { status } = req.body;

  try {
    if (status === 'approved') {
      const application = await db.query.admissions.findFirst({ where: eq(admissions.id, id) });
      if (!application) {
        return res.status(404).json({ status: 'error', message: 'Application not found' });
      }

      // Generate Student ID: STU-YEAR-RANDOM
      const year = new Date().getFullYear().toString().substr(-2);
      const random = Math.random().toString(36).substr(2, 6).toUpperCase(); // Increased to 6 chars for uniqueness
      const studentId = `STU-${year}${random}`;

      // Find matching class for the grade
      const classesList = await db.query.classes.findMany({
        where: (c, { eq }) => eq(c.schoolId, application.schoolId)
      });
      const matchedClass = classesList.find(c => c.name === application.grade);

      const studentUuid = uuidv4();
      const userUuid = uuidv4();

      // Create Student Record
      await db.insert(students).values({
        id: studentUuid,
        schoolId: application.schoolId,
        classId: matchedClass?.id || null,
        studentId,
        name: application.studentName,
        parentName: application.parentName,
        email: application.email,
        phone: application.phone,
        password: 'student123',
        photoURL: null,
        dob: application.dateOfBirth,
        gender: application.gender,
        aadhaarNumber: application.aadhaarNumber,
        bloodGroup: application.bloodGroup,
        previousSchool: application.previousSchool,
        religion: application.religion,
        category: application.category,
        fatherOccupation: application.fatherOccupation,
        motherName: application.motherName,
        motherOccupation: application.motherOccupation,
        annualIncome: application.annualIncome,
        documents: application.documents,
        grade: application.grade,
        section: matchedClass?.section || 'A',
        userId: userUuid,
        status: 'active',
      });

      // Create User Record only if it doesn't exist
      const existingUser = await db.query.users.findFirst({ where: eq(users.email, application.email) });
      if (!existingUser) {
        await db.insert(users).values({
          uid: userUuid,
          email: application.email || `${studentId}@school.com`,
          name: application.studentName,
          role: 'student',
          schoolId: application.schoolId,
          status: 'active',
          password: 'student123', // Default password
        });
      } else {
        // If user exists, we might want to update their role or schoolId, but for now just use it
        console.log('User already exists, skipping user creation');
      }
    }

    await db.update(admissions)
      .set({ 
        status, 
        updatedAt: new Date().toISOString() 
      })
      .where(eq(admissions.id, id));

    // Send Email Notification
    const application = await db.query.admissions.findFirst({ where: eq(admissions.id, id) });
    if (application && application.email) {
      const school = await db.query.schools.findFirst({ where: eq(schools.id, application.schoolId) });
      
      let studentIdToEmail = undefined;
      if (status === 'approved') {
        const student = await db.query.students.findFirst({ 
          where: (s, { and, eq }) => and(eq(s.email, application.email), eq(s.schoolId, application.schoolId)) 
        });
        studentIdToEmail = student?.studentId;

        await db.update(admissions)
          .set({ studentId: studentIdToEmail })
          .where(eq(admissions.id, id));
      }

      await sendAdmissionEmail(
        application.email,
        application.studentName,
        status as 'approved' | 'rejected',
        { studentId: studentIdToEmail, schoolName: school?.name }
      );
    }

    res.status(200).json({ status: 'success', message: `Application ${status}` });
  } catch (error: any) {
    console.error('Admission Status Update Error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Internal Server Error',
      details: error
    });
  }
});
