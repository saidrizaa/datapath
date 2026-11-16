import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMigrationPayloads,
  calculateNextStreak,
  hasLocalProgressToMigrate,
  mergeProgressStates,
  normalizeCompletedLessons,
  normalizeLessonId,
} from './progressMigration';
import type { ProgressState } from '../services/progressService';

test('normalizeLessonId menormalkan format 1-digit ke 2-digit dengan leading zero', () => {
  assert.equal(normalizeLessonId('excel-1'), 'excel-01');
  assert.equal(normalizeLessonId('excel-01'), 'excel-01');
  assert.equal(normalizeLessonId('EXCEL-5'), 'excel-05');
  assert.deepEqual(normalizeCompletedLessons(['excel-1', 'excel-01', 'excel-2']), [
    'excel-01',
    'excel-02',
  ]);
});

test('hasLocalProgressToMigrate mendeteksi apakah ada progres lokal', () => {
  const empty: ProgressState = {
    completedLessons: [],
    quizAttempts: {},
    exerciseAttempts: {},
    updatedAt: '2026-03-01T00:00:00.000Z',
  };
  assert.equal(hasLocalProgressToMigrate(empty), false);

  const withLesson: ProgressState = {
    ...empty,
    completedLessons: ['excel-01'],
  };
  assert.equal(hasLocalProgressToMigrate(withLesson), true);
});

test('buildMigrationPayloads melewatkan data yang sudah ada di database (termasuk format lama) agar tidak duplikat', () => {
  const local: ProgressState = {
    completedLessons: ['excel-1', 'excel-02', 'excel-01'],
    quizAttempts: {
      'excel-01': {
        score: 4,
        total: 5,
        answers: { 'e1-q1': 2 },
        completedAt: '2026-03-01T10:00:00.000Z',
      },
      'excel-02': {
        score: 5,
        total: 5,
        answers: { 'e2-q1': 1 },
        completedAt: '2026-03-02T10:00:00.000Z',
      },
    },
    exerciseAttempts: {},
    updatedAt: '2026-03-02T10:00:00.000Z',
  };

  const remoteCompleted = new Set(['excel-01']);
  const remoteQuizzes = new Set(['excel-01']);

  const { lessonRows, quizRows } = buildMigrationPayloads(
    'user-123',
    local,
    remoteCompleted,
    remoteQuizzes
  );

  assert.equal(lessonRows.length, 1);
  assert.equal(lessonRows[0].lesson_id, 'excel-02');
  assert.equal(lessonRows[0].user_id, 'user-123');

  assert.equal(quizRows.length, 1);
  assert.equal(quizRows[0].lesson_id, 'excel-02');
  assert.equal(quizRows[0].score, 5);
});

test('mergeProgressStates menggabungkan pelajaran selesai dan memprioritaskan skor remote jika ada', () => {
  const remote: ProgressState = {
    completedLessons: ['excel-01'],
    quizAttempts: {
      'excel-01': {
        score: 5,
        total: 5,
        answers: { 'e1-q1': 2 },
        completedAt: '2026-03-05T10:00:00.000Z',
      },
    },
    exerciseAttempts: {},
    updatedAt: '2026-03-05T10:00:00.000Z',
  };
  const local: ProgressState = {
    completedLessons: ['excel-2'],
    quizAttempts: {
      'excel-01': {
        score: 3,
        total: 5,
        answers: { 'e1-q1': 0 },
        completedAt: '2026-03-01T10:00:00.000Z',
      },
      'excel-2': {
        score: 4,
        total: 5,
        answers: { 'e2-q1': 1 },
        completedAt: '2026-03-02T10:00:00.000Z',
      },
    },
    exerciseAttempts: {},
    updatedAt: '2026-03-02T10:00:00.000Z',
  };

  const merged = mergeProgressStates(remote, local);
  assert.deepEqual(merged.completedLessons.sort(), ['excel-01', 'excel-02']);
  assert.equal(merged.quizAttempts['excel-01'].score, 5);
  assert.equal(merged.quizAttempts['excel-02'].score, 4);
});

test('calculateNextStreak menghitung streak awal, beruntun, hari sama, dan reset setelah jeda', () => {
  const initial = calculateNextStreak(
    { currentStreak: 0, longestStreak: 0, lastActivityDate: null },
    '2026-03-10'
  );
  assert.deepEqual(initial, {
    currentStreak: 1,
    longestStreak: 1,
    lastActivityDate: '2026-03-10',
  });

  const sameDay = calculateNextStreak(initial, '2026-03-10');
  assert.equal(sameDay.currentStreak, 1);

  const nextDay = calculateNextStreak(sameDay, '2026-03-11');
  assert.deepEqual(nextDay, {
    currentStreak: 2,
    longestStreak: 2,
    lastActivityDate: '2026-03-11',
  });

  const afterGap = calculateNextStreak(nextDay, '2026-03-14');
  assert.deepEqual(afterGap, {
    currentStreak: 1,
    longestStreak: 2,
    lastActivityDate: '2026-03-14',
  });
});
