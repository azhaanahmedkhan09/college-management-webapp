import { TimetableSlot, Student, Invoice } from '../types';

export interface CollisionCheckResult {
  hasCollision: boolean;
  type?: 'classroom' | 'professor';
  message?: string;
}

/**
 * Checks whether a proposed timetable slot collides with an existing slot
 * on the same day and time (either classroom double-booking or professor double-booking).
 */
export function detectTimetableCollision(
  existingSlots: TimetableSlot[],
  candidate: {
    day: TimetableSlot['day'];
    time: string;
    classroom: string;
    professorId: string;
    professorName: string;
  }
): CollisionCheckResult {
  const classroomConflict = existingSlots.find(
    (slot) =>
      slot.day === candidate.day &&
      slot.time === candidate.time &&
      slot.classroom.trim().toLowerCase() === candidate.classroom.trim().toLowerCase()
  );

  if (classroomConflict) {
    return {
      hasCollision: true,
      type: 'classroom',
      message: `Collision Warning: "${candidate.classroom}" is already booked for "${classroomConflict.subject}" with ${classroomConflict.professorName} at this time.`
    };
  }

  const professorConflict = existingSlots.find(
    (slot) =>
      slot.day === candidate.day &&
      slot.time === candidate.time &&
      slot.professorId === candidate.professorId
  );

  if (professorConflict) {
    return {
      hasCollision: true,
      type: 'professor',
      message: `Conflict Warning: ${candidate.professorName} is already scheduled to teach "${professorConflict.subject}" in "${professorConflict.classroom}" during this slot.`
    };
  }

  return { hasCollision: false };
}

/**
 * Computes weighted grade score and letter grade from midterm, final, and assignment marks.
 * Weights: Midterm 30%, Final 50%, Assignments 20%.
 */
export function computeWeightedGrade(midterm: number, finalExam: number, assignments: number): {
  totalScore: number;
  letterGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  gpaPoints: number;
} {
  const clampedMid = Math.max(0, Math.min(100, midterm));
  const clampedFinal = Math.max(0, Math.min(100, finalExam));
  const clampedAssign = Math.max(0, Math.min(100, assignments));

  const totalScore = Math.round(clampedMid * 0.3 + clampedFinal * 0.5 + clampedAssign * 0.2);

  if (totalScore >= 95) return { totalScore, letterGrade: 'A+', gpaPoints: 4.0 };
  if (totalScore >= 85) return { totalScore, letterGrade: 'A', gpaPoints: 3.8 };
  if (totalScore >= 75) return { totalScore, letterGrade: 'B', gpaPoints: 3.2 };
  if (totalScore >= 65) return { totalScore, letterGrade: 'C', gpaPoints: 2.5 };
  if (totalScore >= 50) return { totalScore, letterGrade: 'D', gpaPoints: 1.8 };
  return { totalScore, letterGrade: 'F', gpaPoints: 0.0 };
}

/**
 * Evaluates student attendance standing and how many consecutive sessions are needed to reach the 75% threshold.
 */
export function evaluateAttendanceStanding(
  presentCount: number,
  totalSessions: number,
  minimumRequiredPercent = 75
): {
  percentage: number;
  status: 'Safe' | 'At Risk / Warning' | 'Critical / High Risk';
  sessionsNeededForMinimum: number;
} {
  if (totalSessions <= 0) {
    return { percentage: 100, status: 'Safe', sessionsNeededForMinimum: 0 };
  }

  const safePresent = Math.max(0, Math.min(totalSessions, presentCount));
  const percentage = Math.round((safePresent / totalSessions) * 100);

  let status: 'Safe' | 'At Risk / Warning' | 'Critical / High Risk' = 'Safe';
  if (percentage < minimumRequiredPercent) {
    status = 'Critical / High Risk';
  } else if (percentage < 85) {
    status = 'At Risk / Warning';
  }

  // Solve (safePresent + x) / (totalSessions + x) >= minimumRequiredPercent / 100
  const targetRatio = minimumRequiredPercent / 100;
  let sessionsNeededForMinimum = 0;
  if (safePresent / totalSessions < targetRatio && targetRatio < 1) {
    sessionsNeededForMinimum = Math.ceil(
      (targetRatio * totalSessions - safePresent) / (1 - targetRatio)
    );
  }

  return {
    percentage,
    status,
    sessionsNeededForMinimum: Math.max(0, sessionsNeededForMinimum)
  };
}

/**
 * Computes invoice balance summary for guardian / student fee ledgers.
 */
export function calculateInvoiceSummary(invoice: Pick<Invoice, 'tuitionFee' | 'labFee' | 'libraryFee' | 'paidAmount'>): {
  totalInvoiced: number;
  outstandingBalance: number;
  paidPercentage: number;
  computedStatus: 'Paid' | 'Pending' | 'Partial';
} {
  const totalInvoiced = invoice.tuitionFee + invoice.labFee + invoice.libraryFee;
  const outstandingBalance = Math.max(0, totalInvoiced - invoice.paidAmount);
  const paidPercentage = totalInvoiced > 0 ? Math.round((invoice.paidAmount / totalInvoiced) * 100) : 100;
  const computedStatus =
    outstandingBalance === 0 ? 'Paid' : invoice.paidAmount > 0 ? 'Partial' : 'Pending';

  return {
    totalInvoiced,
    outstandingBalance,
    paidPercentage,
    computedStatus
  };
}
