import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTrackProgressSummaries,
  buildWeeklyActivitySeries,
  calculateXpBreakdown,
  evaluateUnlockedBadges,
  getRecentActivities,
  getRecommendedLessons,
} from './gamification';
import { TRACKS } from '../data/curriculum';
import type { ProgressState } from '../services/progressService';

function createSampleProgress(overrides: Partial<ProgressState> = {}): ProgressState {
  return {
    completedLessons: [],
    quizAttempts: {},
    exerciseAttempts: {},
    activityLog: [],
    updatedAt: '2026-11-16T00:00:00.000Z',
    ...overrides,
  };
}

test('calculateXpBreakdown menghitung XP pelajaran (+50), kuis lulus >=70% (+30), latihan benar (+20), dan bonus streak 7 hari (+100)', () => {
  const progress = createSampleProgress({
    completedLessons: ['excel-01', 'excel-02'], // 2 * 50 = 100
    quizAttempts: {
      'excel-01': { score: 4, total: 5, answers: {}, completedAt: '2026-11-16T10:00:00Z' }, // 80% -> +30
      'excel-02': { score: 2, total: 5, answers: {}, completedAt: '2026-11-16T11:00:00Z' }, // 40% -> +0
    },
    exerciseAttempts: {
      'excel-01:py-01': {
        lessonId: 'excel-01',
        exerciseId: 'py-01',
        exerciseType: 'python',
        status: 'passed',
        attemptsCount: 1,
        lastSubmission: 'print(5720000)',
        updatedAt: '2026-11-16T10:05:00Z',
        passedAt: '2026-11-16T10:05:00Z',
      },
      'excel-01:sql-01': {
        lessonId: 'excel-01',
        exerciseId: 'sql-01',
        exerciseType: 'sql',
        status: 'attempted',
        attemptsCount: 1,
        lastSubmission: 'SELECT 1',
        updatedAt: '2026-11-16T10:06:00Z',
      },
    },
  });

  const breakdown = calculateXpBreakdown(
    progress,
    {
      currentStreak: 7,
      longestStreak: 7,
      lastActivityDate: '2026-11-16',
    },
    1
  );

  assert.equal(breakdown.lessonXp, 100);
  assert.equal(breakdown.quizXp, 30);
  assert.equal(breakdown.exerciseXp, 20);
  assert.equal(breakdown.streakBonusXp, 100);
  assert.equal(breakdown.portfolioXp, 50);
  assert.equal(breakdown.totalXp, 300);
});

test('evaluateUnlockedBadges membuka badge sesuai syarat dan mendeteksi badge yang baru terbuka', () => {
  const progress = createSampleProgress({
    completedLessons: ['excel-01', 'excel-02', 'excel-03', 'excel-04', 'excel-05'],
    quizAttempts: {
      'excel-01': { score: 5, total: 5, answers: {}, completedAt: '2026-11-16T08:00:00Z' },
    },
    exerciseAttempts: {
      'excel-01:py-01': {
        lessonId: 'excel-01',
        exerciseId: 'py-01',
        exerciseType: 'python',
        status: 'attempted',
        attemptsCount: 1,
        lastSubmission: 'print(1)',
        updatedAt: '2026-11-16T08:01:00Z',
      },
    },
  });

  const { earnedMap, newlyUnlockedIds } = evaluateUnlockedBadges(
    progress,
    { currentStreak: 3, longestStreak: 3, lastActivityDate: '2026-11-16' },
    { 'langkah-pertama': '2026-11-15T00:00:00Z' },
    '2026-11-16T12:00:00Z',
    1
  );

  assert.equal(earnedMap['langkah-pertama'], '2026-11-15T00:00:00Z');
  assert.ok(earnedMap['konsisten']);
  assert.ok(earnedMap['kuis-sempurna']);
  assert.ok(earnedMap['penjelajah-data']);
  assert.ok(earnedMap['master-excel']);
  assert.ok(earnedMap['portofolio-perdana']);
  assert.equal(earnedMap['seminggu-berturut'], undefined);
  assert.deepEqual(
    newlyUnlockedIds.sort(),
    ['konsisten', 'kuis-sempurna', 'master-excel', 'penjelajah-data', 'portofolio-perdana'].sort()
  );
});

test('buildWeeklyActivitySeries dan getRecentActivities menghasilkan 7 hari dan maks 10 aktivitas terbaru', () => {
  const entries = [
    {
      id: '1',
      kind: 'lesson' as const,
      lessonId: 'excel-01',
      title: 'Pelajaran 1',
      detail: 'Selesai',
      timestamp: '2026-11-16T09:00:00.000Z',
    },
    {
      id: '2',
      kind: 'quiz' as const,
      lessonId: 'excel-01',
      title: 'Kuis 1',
      detail: '5/5',
      timestamp: '2026-11-16T11:00:00.000Z',
    },
    {
      id: '3',
      kind: 'exercise' as const,
      lessonId: 'excel-01',
      title: 'Latihan SQL',
      detail: 'Benar',
      timestamp: '2026-11-14T15:00:00.000Z',
    },
  ];

  const series = buildWeeklyActivitySeries(entries, new Date('2026-11-16T12:00:00.000Z'));
  assert.equal(series.length, 7);
  assert.equal(series[6]?.dateIso, '2026-11-16');
  assert.equal(series[6]?.count, 2);
  assert.equal(series[4]?.dateIso, '2026-11-14');
  assert.equal(series[4]?.count, 1);

  const recent = getRecentActivities(entries, 2);
  assert.equal(recent[0]?.id, '2');
  assert.equal(recent[1]?.id, '1');
});

test('buildTrackProgressSummaries dan getRecommendedLessons menghitung estimasi waktu tersisa dan rekomendasi 1-3 pelajaran', () => {
  const summaries = buildTrackProgressSummaries(TRACKS, ['excel-01']);
  const excel = summaries.find((s) => s.track.id === 'track-excel');
  assert.equal(excel?.completedCount, 1);
  assert.equal(excel?.totalCount, 5);
  assert.equal(excel?.percentage, 20);
  // 30 + 35 + 40 + 45 = 150 menit
  assert.equal(excel?.remainingMinutes, 150);

  const recs = getRecommendedLessons(TRACKS, ['excel-01'], 3);
  assert.equal(recs.length, 3);
  assert.equal(recs[0]?.id, 'excel-02');
  assert.equal(recs[2]?.id, 'excel-04');
});
