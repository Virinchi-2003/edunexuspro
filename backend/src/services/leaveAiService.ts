import { z } from 'zod';

export interface LeaveAiDecision {
  status: 'APPROVED' | 'REJECTED' | 'REVIEW';
  reason: string;
  confidence: number;
}

const MEDICAL_KEYWORDS = ['fever', 'illness', 'hospital', 'doctor', 'surgery', 'cold', 'flu', 'stomach', 'pain', 'medical', 'injury', 'sick', 'headache'];
const EMERGENCY_KEYWORDS = ['emergency', 'family issue', 'urgent', 'death', 'accident', 'mishap', 'unavoidable'];
const REJECT_KEYWORDS = ['party', 'movie', 'outing', 'hangout', 'trip', 'vacation', 'bored', 'shopping', 'celebration', 'wedding'];

export const evaluateLeaveRequest = async (
  message: string,
  startDate: string,
  endDate: string
): Promise<LeaveAiDecision> => {
  const msg = message.toLowerCase();
  
  // Calculate duration in days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationMs = end.getTime() - start.getTime();
  const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1;

  // 1. Basic Validation
  if (!msg || msg.length < 5) {
    return {
      status: 'REJECTED',
      reason: 'Reason is too short or invalid.',
      confidence: 1.0
    };
  }

  // 2. Automated Rejection Rules
  if (REJECT_KEYWORDS.some(k => msg.includes(k)) && durationDays > 1) {
    return {
      status: 'REJECTED',
      reason: 'Non-emergency casual leave detected for multiple days.',
      confidence: 0.85
    };
  }

  if (durationDays > 10) {
    return {
      status: 'REVIEW',
      reason: 'Long duration leave requires manual verification by principal/teacher.',
      confidence: 0.95
    };
  }

  // 3. Automated Approval Rules
  const isMedical = MEDICAL_KEYWORDS.some(k => msg.includes(k));
  const isEmergency = EMERGENCY_KEYWORDS.some(k => msg.includes(k));

  if (isMedical) {
    return {
      status: 'APPROVED',
      reason: 'Medical reason detected. Health-related leaves are auto-approved.',
      confidence: 0.92
    };
  }

  if (isEmergency && durationDays <= 3) {
    return {
      status: 'APPROVED',
      reason: 'Urgent family/personal emergency detected (Short duration).',
      confidence: 0.88
    };
  }

  // 4. Default Case
  if (durationDays <= 2) {
    return {
      status: 'APPROVED',
      reason: 'Short duration casual leave auto-approved.',
      confidence: 0.75
    };
  }

  return {
    status: 'REVIEW',
    reason: 'Leave reason requires further context for automated decision.',
    confidence: 0.60
  };
};
