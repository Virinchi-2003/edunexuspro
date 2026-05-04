import { Request, Response } from 'express';
import { db } from '../config/database';
import { 
  notifications, 
  notificationPreferences, 
  homework, 
  homeworkSubmissions, 
  feeTransactions, 
  conversations, 
  messages, 
  skillAssessments, 
  aiFlags,
  students,
  attendance,
  marks,
  users
} from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, or, desc, sql, count } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';

// --- B1. LIVE DASHBOARD & NOTIFICATIONS ---

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const studentId = getSingleValue(req.params.studentId);
  const today = new Date().toISOString().split('T')[0];

  // 1. Today's Attendance
  const todayAttendance = await db.query.attendance.findFirst({
    where: and(eq(attendance.studentId, studentId), eq(attendance.date, today))
  });

  // 2. Pending Homework
  const student = await db.query.students.findFirst({ where: eq(students.id, studentId) });
  let pendingHomework = [];
  if (student?.classId) {
    const allHomework = await db.query.homework.findMany({
      where: eq(homework.classId, student.classId)
    });
    const submissions = await db.query.homeworkSubmissions.findMany({
      where: eq(homeworkSubmissions.studentId, studentId)
    });
    const submittedIds = submissions.map(s => s.homeworkId);
    pendingHomework = allHomework.filter(h => !submittedIds.includes(h.id));
  }

  // 3. Performance Summary (Average Grade)
  const allMarks = await db.query.marks.findMany({ where: eq(marks.studentId, studentId) });
  const avgMarks = allMarks.length > 0 
    ? (allMarks.reduce((acc: number, m: any) => acc + ((m.marksObtained || 0) / (m.totalMarks || 100)), 0) / allMarks.length) * 100
    : 0;

  // 4. AI Flags
  const activeFlags = await db.query.aiFlags.findMany({
    where: and(eq(aiFlags.studentId, studentId), eq(aiFlags.isResolved, false))
  });

  res.status(200).json({
    status: 'success',
    data: {
      attendance: todayAttendance || { status: 'Not Marked' },
      pendingHomeworkCount: pendingHomework.length,
      averagePerformance: avgMarks.toFixed(1),
      aiFlags: activeFlags
    }
  });
});

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = getSingleValue(req.params.userId);
  const result = await db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: [desc(notifications.createdAt)]
  });
  res.status(200).json({ status: 'success', data: result });
});

// --- B2. DIGITAL DIARY & HOMEWORK ---

export const submitHomework = asyncHandler(async (req: Request, res: Response) => {
  const { homeworkId, studentId, content, attachments } = req.body;
  const id = uuidv4();
  const submission = {
    id,
    homeworkId,
    studentId,
    content,
    attachments: JSON.stringify(attachments || []),
    status: 'submitted',
  };
  await db.insert(homeworkSubmissions).values(submission);
  res.status(201).json({ status: 'success', data: submission });
});

// --- B4. FEE PORTAL ---

export const getFeeHistory = asyncHandler(async (req: Request, res: Response) => {
  const studentId = getSingleValue(req.params.studentId);
  const result = await db.query.feeTransactions.findMany({
    where: eq(feeTransactions.studentId, studentId),
    orderBy: [desc(feeTransactions.createdAt)]
  });
  res.status(200).json({ status: 'success', data: result });
});

// --- B5. COMMUNICATION ---

export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const userId = getSingleValue(req.params.userId);
  
  // Fetch conversations where user is a participant
  const userConversations = await db.query.conversations.findMany({
    where: or(
      eq(conversations.participant1, userId),
      eq(conversations.participant2, userId)
    ),
    orderBy: [desc(conversations.updatedAt)]
  });

  // Enrich with participant details
  const enrichedConversations = await Promise.all(userConversations.map(async (conv) => {
    const otherParticipantId = conv.participant1 === userId ? conv.participant2 : conv.participant1;
    const otherUser = await db.query.users.findFirst({
      where: eq(users.uid, otherParticipantId)
    });
    
    return {
      ...conv,
      otherParticipant: {
        id: otherParticipantId,
        name: otherUser?.name || 'Unknown User',
        role: otherUser?.role || 'User',
        photoURL: otherUser?.photoURL
      }
    };
  }));

  res.status(200).json({ status: 'success', data: enrichedConversations });
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const conversationId = getSingleValue(req.params.conversationId);
  const result = await db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    orderBy: [desc(messages.createdAt)],
    limit: 50
  });
  // Return in chronological order
  res.status(200).json({ status: 'success', data: result.reverse() });
});

export const startConversation = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, participant1, participant2 } = req.body;

  // Check if conversation already exists
  const existing = await db.query.conversations.findFirst({
    where: or(
      and(eq(conversations.participant1, participant1), eq(conversations.participant2, participant2)),
      and(eq(conversations.participant1, participant2), eq(conversations.participant2, participant1))
    )
  });

  if (existing) {
    return res.status(200).json({ status: 'success', data: existing });
  }

  const id = uuidv4();
  const newConv = {
    id,
    schoolId,
    participant1,
    participant2,
    updatedAt: new Date().toISOString()
  };

  await db.insert(conversations).values(newConv);
  res.status(201).json({ status: 'success', data: newConv });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId, senderId, content, fileUrl, fileType } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const newMessage = { 
    id, 
    conversationId, 
    senderId, 
    content, 
    fileUrl, 
    fileType,
    createdAt: now 
  };
  
  await db.insert(messages).values(newMessage);
  
  await db.update(conversations)
    .set({ 
      lastMessage: fileUrl ? `Shared a ${fileType}` : content, 
      updatedAt: now 
    })
    .where(eq(conversations.id, conversationId));
    
  res.status(201).json({ status: 'success', data: newMessage });
});
