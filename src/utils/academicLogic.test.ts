import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectTimetableCollision,
  computeWeightedGrade,
  evaluateAttendanceStanding,
  calculateInvoiceSummary
} from './academicLogic';
import { INITIAL_TIMETABLE, MOCK_STUDENTS } from '../data';

describe('GM University Campus Sphere - Pure Academic Logic', () => {
  it('verifies GM University B.Tech dataset migration invariants', () => {
    assert.equal(MOCK_STUDENTS.length, 7, 'Should have 7 B.Tech scholars');
    for (const student of MOCK_STUDENTS) {
      assert.match(student.rollNo, /^GMU-BT-/, `Expected GMU-BT roll number for ${student.name}`);
      assert.equal(
        student.department,
        'Bachelor of Technology (B.Tech - Computer Science & Engineering)'
      );
    }
  });

  it('detects classroom double-booking collisions accurately', () => {
    const existing = INITIAL_TIMETABLE;
    const collision = detectTimetableCollision(existing, {
      day: 'Monday',
      time: '09:00 AM - 10:30 AM',
      classroom: 'Lab Room 101',
      professorId: 'usr-staff-999',
      professorName: 'Dr. Test'
    });
    assert.equal(collision.hasCollision, true);
    assert.equal(collision.type, 'classroom');
  });

  it('detects professor schedule conflicts across different rooms', () => {
    const existing = INITIAL_TIMETABLE;
    const collision = detectTimetableCollision(existing, {
      day: 'Monday',
      time: '09:00 AM - 10:30 AM',
      classroom: 'Room 405',
      professorId: 'usr-staff-1',
      professorName: 'Prashantini Ma\'am'
    });
    assert.equal(collision.hasCollision, true);
    assert.equal(collision.type, 'professor');
  });

  it('allows non-conflicting timetable slots', () => {
    const existing = INITIAL_TIMETABLE;
    const result = detectTimetableCollision(existing, {
      day: 'Friday',
      time: '02:00 PM - 03:30 PM',
      classroom: 'Room 405',
      professorId: 'staff-1',
      professorName: 'Roshan Sir'
    });
    assert.equal(result.hasCollision, false);
  });

  it('computes weighted grades and GPA points accurately across boundaries', () => {
    const top = computeWeightedGrade(98, 96, 100);
    assert.equal(top.totalScore, 97);
    assert.equal(top.letterGrade, 'A+');
    assert.equal(top.gpaPoints, 4.0);

    const mid = computeWeightedGrade(75, 78, 80);
    assert.equal(mid.totalScore, 78);
    assert.equal(mid.letterGrade, 'B');

    const fail = computeWeightedGrade(30, 40, 20);
    assert.equal(fail.letterGrade, 'F');
    assert.equal(fail.gpaPoints, 0.0);
  });

  it('evaluates attendance risk categories and sessions required to reach 75%', () => {
    const critical = evaluateAttendanceStanding(6, 10, 75);
    assert.equal(critical.percentage, 60);
    assert.equal(critical.status, 'Critical / High Risk');
    assert.equal(critical.sessionsNeededForMinimum, 6); // (6+6)/(10+6) = 12/16 = 75%

    const safe = evaluateAttendanceStanding(9, 10, 75);
    assert.equal(safe.percentage, 90);
    assert.equal(safe.status, 'Safe');
    assert.equal(safe.sessionsNeededForMinimum, 0);
  });

  it('calculates student invoice balances and payment statuses', () => {
    const summary = calculateInvoiceSummary({
      tuitionFee: 2500,
      labFee: 450,
      libraryFee: 150,
      paidAmount: 1800
    });
    assert.equal(summary.totalInvoiced, 3100);
    assert.equal(summary.outstandingBalance, 1300);
    assert.equal(summary.computedStatus, 'Partial');
  });
});
