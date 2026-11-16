import type { ProgressState, QuizAttemptRecord } from '../services/progressService';

export interface LessonProgressUpsertRow {
  user_id: string;
  track_slug: string;
  lesson_id: string;
  is_completed: boolean;
  completed_at: string;
}

export interface QuizAttemptInsertRow {
  user_id: string;
  lesson_id: string;
  score: number;
  total: number;
  answers: Record<string, number>;
  completed_at: string;
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

export type ExerciseType = 'python' | 'sql' | 'excel';
export type ExerciseStatus = 'attempted' | 'passed';

export interface ExerciseAttemptRecord {
  lessonId: string;
  exerciseId: string;
  exerciseType: ExerciseType;
  status: ExerciseStatus;
  attemptsCount: number;
  lastSubmission: string;
  updatedAt: string;
  passedAt?: string;
}

export function buildExerciseKey(lessonId: string, exerciseId: string): string {
  return `${normalizeLessonId(lessonId)}:${exerciseId.trim()}`;
}

export function normalizeExerciseAttempts(
  attempts: Record<string, ExerciseAttemptRecord> | undefined
): Record<string, ExerciseAttemptRecord> {
  if (!attempts || typeof attempts !== 'object') return {};
  const normalized: Record<string, ExerciseAttemptRecord> = {};

  for (const record of Object.values(attempts)) {
    if (!record || !record.lessonId || !record.exerciseId) continue;
    const lessonId = normalizeLessonId(record.lessonId);
    const key = buildExerciseKey(lessonId, record.exerciseId);
    const existing = normalized[key];
    if (!existing) {
      normalized[key] = { ...record, lessonId };
      continue;
    }
    const bestStatus: ExerciseStatus =
      existing.status === 'passed' || record.status === 'passed' ? 'passed' : 'attempted';
    const existingTime = Date.parse(existing.updatedAt || '') || 0;
    const incomingTime = Date.parse(record.updatedAt || '') || 0;
    const newer = incomingTime >= existingTime ? record : existing;
    normalized[key] = {
      ...newer,
      lessonId,
      status: bestStatus,
      attemptsCount: Math.max(existing.attemptsCount, record.attemptsCount),
      passedAt: existing.passedAt ?? record.passedAt,
    };
  }

  return normalized;
}

/**
 * Menormalkan lesson_id ke format dua digit dengan leading zero (mis. 'excel-1' -> 'excel-01').
 */
export function normalizeLessonId(lessonId: string): string {
  const trimmed = lessonId.trim().toLowerCase();
  const match = /^(excel)-(\d)$/.exec(trimmed);
  if (match) {
    return `${match[1]}-0${match[2]}`;
  }
  return trimmed;
}

export function normalizeCompletedLessons(lessonIds: string[]): string[] {
  const unique = new Set<string>();
  for (const id of lessonIds) {
    if (typeof id !== 'string') continue;
    const normalized = normalizeLessonId(id);
    if (normalized) unique.add(normalized);
  }
  return Array.from(unique);
}

export function normalizeQuizAttempts(
  attempts: Record<string, QuizAttemptRecord>
): Record<string, QuizAttemptRecord> {
  const normalized: Record<string, QuizAttemptRecord> = {};
  for (const [rawId, record] of Object.entries(attempts)) {
    const id = normalizeLessonId(rawId);
    if (!id || !record) continue;
    const existing = normalized[id];
    if (!existing) {
      normalized[id] = record;
      continue;
    }
    const existingTime = Date.parse(existing.completedAt || '') || 0;
    const incomingTime = Date.parse(record.completedAt || '') || 0;
    if (incomingTime >= existingTime) {
      normalized[id] = record;
    }
  }
  return normalized;
}

export function hasLocalProgressToMigrate(localState: ProgressState): boolean {
  return (
    normalizeCompletedLessons(localState.completedLessons).length > 0 ||
    Object.keys(normalizeQuizAttempts(localState.quizAttempts)).length > 0 ||
    Object.keys(normalizeExerciseAttempts(localState.exerciseAttempts)).length > 0
  );
}

export interface ExerciseAttemptUpsertRow {
  user_id: string;
  lesson_id: string;
  exercise_id: string;
  exercise_type: ExerciseType;
  status: ExerciseStatus;
  attempts_count: number;
  last_submission: string;
  passed_at: string | null;
  updated_at: string;
}

/**
 * Menyusun payload migrasi satu kali dari localStorage ke Supabase tanpa duplikasi:
 * pelajaran/kuis/latihan yang sudah ada di remote dilewati agar tidak menimpa progres cloud.
 */
export function buildMigrationPayloads(
  userId: string,
  localState: ProgressState,
  remoteCompletedIds: Set<string>,
  remoteQuizLessonIds: Set<string>,
  trackSlug = 'excel-analisis-data',
  remoteExerciseKeys: Set<string> = new Set()
): {
  lessonRows: LessonProgressUpsertRow[];
  quizRows: QuizAttemptInsertRow[];
  exerciseRows: ExerciseAttemptUpsertRow[];
} {
  const nowIso = new Date().toISOString();
  const normalizedRemoteCompleted = new Set(
    Array.from(remoteCompletedIds, (id) => normalizeLessonId(id))
  );
  const normalizedRemoteQuizIds = new Set(
    Array.from(remoteQuizLessonIds, (id) => normalizeLessonId(id))
  );

  const uniqueLocalLessons = normalizeCompletedLessons(localState.completedLessons);
  const lessonRows: LessonProgressUpsertRow[] = uniqueLocalLessons
    .filter((lessonId) => !normalizedRemoteCompleted.has(lessonId))
    .map((lessonId) => ({
      user_id: userId,
      track_slug: trackSlug,
      lesson_id: lessonId,
      is_completed: true,
      completed_at: localState.updatedAt || nowIso,
    }));

  const normalizedQuizzes = normalizeQuizAttempts(localState.quizAttempts);
  const quizRows: QuizAttemptInsertRow[] = Object.entries(normalizedQuizzes)
    .filter(([lessonId]) => !normalizedRemoteQuizIds.has(lessonId))
    .map(([lessonId, attempt]) => ({
      user_id: userId,
      lesson_id: lessonId,
      score: attempt.score,
      total: attempt.total,
      answers: attempt.answers ?? {},
      completed_at: attempt.completedAt || nowIso,
    }));

  const normalizedExercises = normalizeExerciseAttempts(localState.exerciseAttempts);
  const exerciseRows: ExerciseAttemptUpsertRow[] = Object.entries(normalizedExercises)
    .filter(([key]) => !remoteExerciseKeys.has(key))
    .map(([, ex]) => ({
      user_id: userId,
      lesson_id: ex.lessonId,
      exercise_id: ex.exerciseId,
      exercise_type: ex.exerciseType,
      status: ex.status,
      attempts_count: ex.attemptsCount,
      last_submission: ex.lastSubmission,
      passed_at: ex.passedAt ?? null,
      updated_at: ex.updatedAt || nowIso,
    }));

  return { lessonRows, quizRows, exerciseRows };
}

export function mergeProgressStates(
  remoteState: ProgressState,
  localState: ProgressState
): ProgressState {
  const completedLessons = normalizeCompletedLessons([
    ...remoteState.completedLessons,
    ...localState.completedLessons,
  ]);

  const quizAttempts: Record<string, QuizAttemptRecord> = {
    ...normalizeQuizAttempts(localState.quizAttempts),
    ...normalizeQuizAttempts(remoteState.quizAttempts),
  };

  const exerciseAttempts = normalizeExerciseAttempts({
    ...(localState.exerciseAttempts ?? {}),
    ...(remoteState.exerciseAttempts ?? {}),
  });

  return {
    completedLessons,
    quizAttempts,
    exerciseAttempts,
    updatedAt: new Date().toISOString(),
  };
}

function addDaysIso(dateIso: string, days: number): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/**
 * Menghitung pembaruan streak harian berdasarkan tanggal aktivitas terakhir (YYYY-MM-DD).
 */
export function calculateNextStreak(
  current: StreakState,
  activityDateIso: string
): StreakState {
  if (!current.lastActivityDate) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(1, current.longestStreak),
      lastActivityDate: activityDateIso,
    };
  }

  if (current.lastActivityDate === activityDateIso) {
    return {
      currentStreak: Math.max(1, current.currentStreak),
      longestStreak: Math.max(current.longestStreak, current.currentStreak, 1),
      lastActivityDate: activityDateIso,
    };
  }

  const yesterdayOfActivity = addDaysIso(activityDateIso, -1);
  if (current.lastActivityDate === yesterdayOfActivity) {
    const nextCurrent = current.currentStreak + 1;
    return {
      currentStreak: nextCurrent,
      longestStreak: Math.max(current.longestStreak, nextCurrent),
      lastActivityDate: activityDateIso,
    };
  }

  // Terputus lebih dari 1 hari -> mulai ulang dari 1
  return {
    currentStreak: 1,
    longestStreak: Math.max(current.longestStreak, 1),
    lastActivityDate: activityDateIso,
  };
}
