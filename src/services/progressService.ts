// Service layer penyimpanan progres belajar.
// Mendukung dual-mode: Supabase PostgreSQL (saat user login & env tersedia)
// dengan fallback otomatis ke localStorage saat mode tamu atau tanpa konfigurasi Supabase.

import { formatSupabaseError, isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  buildExerciseKey,
  buildMigrationPayloads,
  calculateNextStreak,
  hasLocalProgressToMigrate,
  normalizeCompletedLessons,
  normalizeExerciseAttempts,
  normalizeLessonId,
  normalizeQuizAttempts,
  type ExerciseAttemptRecord,
  type ExerciseType,
  type StreakState,
} from '../lib/progressMigration';

import {
  BADGE_DEFINITIONS,
  type ActivityLogEntry,
  type EarnedBadgeMap,
} from '../lib/gamification';
import { TRACKS } from '../data/curriculum';

export interface QuizAttemptRecord {
  score: number;
  total: number;
  answers: Record<string, number>;
  completedAt: string;
}

export interface ProgressState {
  completedLessons: string[];
  quizAttempts: Record<string, QuizAttemptRecord>;
  exerciseAttempts: Record<string, ExerciseAttemptRecord>;
  activityLog?: ActivityLogEntry[];
  updatedAt: string;
}

export interface ProgressStorageAdapter {
  read(): string | null;
  write(raw: string): void;
}

export interface TrackCompletionStats {
  completedCount: number;
  totalCount: number;
  percentage: number;
}

const STORAGE_KEY = 'datapath-progress-v1';
const STREAK_STORAGE_KEY = 'datapath-streak-v1';
const BADGES_STORAGE_KEY = 'datapath-badges-v1';
const MIGRATION_FLAG_PREFIX = 'datapath-migrated-v1:';

function resolveLessonTitle(lessonId: string): string {
  const canonical = normalizeLessonId(lessonId);
  for (const track of TRACKS) {
    const idx = track.starterLessons.findIndex((l) => l.id === canonical);
    if (idx !== -1) {
      const lesson = track.starterLessons[idx];
      const num = String(idx + 1).padStart(2, '0');
      return `${num}. ${lesson.title}`;
    }
  }
  return canonical.toUpperCase();
}

function appendActivityLog(
  existing: ActivityLogEntry[] | undefined,
  entry: ActivityLogEntry
): ActivityLogEntry[] {
  const list = Array.isArray(existing) ? existing : [];
  return [entry, ...list].slice(0, 200);
}

export function readLocalStreak(): StreakState {
  if (typeof window === 'undefined') {
    return { currentStreak: 0, longestStreak: 0, lastActivityDate: null };
  }
  try {
    const raw = window.localStorage.getItem(STREAK_STORAGE_KEY);
    if (!raw) return { currentStreak: 0, longestStreak: 0, lastActivityDate: null };
    const parsed = JSON.parse(raw) as Partial<StreakState>;
    return {
      currentStreak: Number(parsed.currentStreak ?? 0),
      longestStreak: Number(parsed.longestStreak ?? 0),
      lastActivityDate: typeof parsed.lastActivityDate === 'string' ? parsed.lastActivityDate : null,
    };
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastActivityDate: null };
  }
}

export function touchLocalDailyStreak(activityDateIso = new Date().toISOString().slice(0, 10)): StreakState {
  const current = readLocalStreak();
  const next = calculateNextStreak(current, activityDateIso);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('datapath-streak-changed'));
    } catch {
      // Abaikan bila diblokir
    }
  }
  return next;
}

export function readLocalBadges(): EarnedBadgeMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(BADGES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return {};
    const map: EarnedBadgeMap = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string' && BADGE_DEFINITIONS.some((b) => b.id === k)) {
        map[k] = v;
      }
    }
    return map;
  } catch {
    return {};
  }
}

export function writeLocalBadges(badges: EarnedBadgeMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(badges));
  } catch {
    // Abaikan bila diblokir
  }
}

const browserStorageAdapter: ProgressStorageAdapter = {
  read() {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  },
  write(raw: string) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, raw);
    } catch {
      // Abaikan jika penyimpanan lokal diblokir browser
    }
  },
};

export function createEmptyProgress(): ProgressState {
  return {
    completedLessons: [],
    quizAttempts: {},
    exerciseAttempts: {},
    activityLog: [],
    updatedAt: new Date().toISOString(),
  };
}

export function createProgressService(adapter: ProgressStorageAdapter = browserStorageAdapter) {
  const listeners = new Set<() => void>();

  function notify() {
    listeners.forEach((listener) => listener());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('datapath-progress-changed'));
    }
  }

  function getProgress(): ProgressState {
    const raw = adapter.read();
    if (!raw) return createEmptyProgress();
    try {
      const parsed = JSON.parse(raw) as Partial<ProgressState>;
      const completedLessons = Array.isArray(parsed.completedLessons)
        ? normalizeCompletedLessons(
            parsed.completedLessons.filter((item): item is string => typeof item === 'string')
          )
        : [];
      const quizAttempts =
        parsed.quizAttempts && typeof parsed.quizAttempts === 'object'
          ? normalizeQuizAttempts(parsed.quizAttempts)
          : {};
      const exerciseAttempts =
        parsed.exerciseAttempts && typeof parsed.exerciseAttempts === 'object'
          ? normalizeExerciseAttempts(parsed.exerciseAttempts)
          : {};
      const activityLog = Array.isArray(parsed.activityLog)
        ? parsed.activityLog.filter(
            (item): item is ActivityLogEntry =>
              Boolean(item && typeof item.id === 'string' && typeof item.timestamp === 'string')
          )
        : [];
      return {
        completedLessons,
        quizAttempts,
        exerciseAttempts,
        activityLog,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      };
    } catch {
      return createEmptyProgress();
    }
  }

  function saveProgress(next: ProgressState): ProgressState {
    const updated: ProgressState = {
      completedLessons: normalizeCompletedLessons(next.completedLessons),
      quizAttempts: normalizeQuizAttempts(next.quizAttempts),
      exerciseAttempts: normalizeExerciseAttempts(next.exerciseAttempts),
      activityLog: Array.isArray(next.activityLog) ? next.activityLog.slice(0, 200) : [],
      updatedAt: new Date().toISOString(),
    };
    adapter.write(JSON.stringify(updated));
    notify();
    return updated;
  }

  function isLessonCompleted(lessonId: string): boolean {
    const canonicalId = normalizeLessonId(lessonId);
    return getProgress().completedLessons.includes(canonicalId);
  }

  function toggleLessonCompletion(lessonId: string): ProgressState {
    const canonicalId = normalizeLessonId(lessonId);
    const current = getProgress();
    const exists = current.completedLessons.includes(canonicalId);
    const completedLessons = exists
      ? current.completedLessons.filter((id) => id !== canonicalId)
      : [...current.completedLessons, canonicalId];

    const nowIso = new Date().toISOString();
    const nextLog = exists
      ? current.activityLog
      : appendActivityLog(current.activityLog, {
          id: `lesson-${canonicalId}-${Date.now()}`,
          kind: 'lesson',
          lessonId: canonicalId,
          title: `Menyelesaikan Pelajaran ${resolveLessonTitle(canonicalId)}`,
          detail: '+50 XP',
          timestamp: nowIso,
        });

    if (!exists && adapter === browserStorageAdapter) {
      touchLocalDailyStreak(nowIso.slice(0, 10));
    }

    return saveProgress({
      ...current,
      completedLessons,
      activityLog: nextLog,
    });
  }

  function markLessonCompleted(lessonId: string): ProgressState {
    const canonicalId = normalizeLessonId(lessonId);
    const current = getProgress();
    if (current.completedLessons.includes(canonicalId)) return current;
    const nowIso = new Date().toISOString();
    if (adapter === browserStorageAdapter) {
      touchLocalDailyStreak(nowIso.slice(0, 10));
    }
    return saveProgress({
      ...current,
      completedLessons: [...current.completedLessons, canonicalId],
      activityLog: appendActivityLog(current.activityLog, {
        id: `lesson-${canonicalId}-${Date.now()}`,
        kind: 'lesson',
        lessonId: canonicalId,
        title: `Menyelesaikan Pelajaran ${resolveLessonTitle(canonicalId)}`,
        detail: '+50 XP',
        timestamp: nowIso,
      }),
    });
  }

  function saveQuizAttempt(
    lessonId: string,
    score: number,
    total: number,
    answers: Record<string, number>
  ): ProgressState {
    const canonicalId = normalizeLessonId(lessonId);
    const current = getProgress();
    const nowIso = new Date().toISOString();
    if (adapter === browserStorageAdapter) {
      touchLocalDailyStreak(nowIso.slice(0, 10));
    }
    const passed = total > 0 && score / total >= 0.7;

    return saveProgress({
      ...current,
      quizAttempts: {
        ...current.quizAttempts,
        [canonicalId]: {
          score,
          total,
          answers,
          completedAt: nowIso,
        },
      },
      activityLog: appendActivityLog(current.activityLog, {
        id: `quiz-${canonicalId}-${Date.now()}`,
        kind: 'quiz',
        lessonId: canonicalId,
        title: `Kuis ${resolveLessonTitle(canonicalId)}`,
        detail: `Skor ${score}/${total}${passed ? ' (Lulus +30 XP)' : ''}`,
        timestamp: nowIso,
      }),
    });
  }

  function saveExerciseAttempt(
    lessonId: string,
    exerciseId: string,
    exerciseType: ExerciseType,
    passed: boolean,
    lastSubmission: string
  ): ProgressState {
    const canonicalLessonId = normalizeLessonId(lessonId);
    const key = buildExerciseKey(canonicalLessonId, exerciseId);
    const current = getProgress();
    const existing = current.exerciseAttempts[key];
    const nowIso = new Date().toISOString();

    if (adapter === browserStorageAdapter) {
      touchLocalDailyStreak(nowIso.slice(0, 10));
    }

    const nextRecord: ExerciseAttemptRecord = {
      lessonId: canonicalLessonId,
      exerciseId: exerciseId.trim(),
      exerciseType,
      status: existing?.status === 'passed' || passed ? 'passed' : 'attempted',
      attemptsCount: (existing?.attemptsCount ?? 0) + 1,
      lastSubmission: lastSubmission.slice(0, 2000),
      updatedAt: nowIso,
      passedAt: existing?.passedAt ?? (passed ? nowIso : undefined),
    };

    const typeLabel =
      exerciseType === 'python' ? 'Python' : exerciseType === 'sql' ? 'SQL' : 'Grid Excel';

    return saveProgress({
      ...current,
      exerciseAttempts: {
        ...current.exerciseAttempts,
        [key]: nextRecord,
      },
      activityLog: appendActivityLog(current.activityLog, {
        id: `ex-${key}-${Date.now()}`,
        kind: 'exercise',
        lessonId: canonicalLessonId,
        title: `Latihan ${typeLabel} (${resolveLessonTitle(canonicalLessonId)})`,
        detail: passed ? 'Jawaban benar (+20 XP)' : 'Percobaan dicatat',
        timestamp: nowIso,
      }),
    });
  }

  function getTrackStats(lessonIds: string[]): TrackCompletionStats {
    const completedSet = new Set(getProgress().completedLessons);
    const canonicalIds = normalizeCompletedLessons(lessonIds);
    const totalCount = canonicalIds.length;
    const completedCount = canonicalIds.filter((id) => completedSet.has(id)).length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    return { completedCount, totalCount, percentage };
  }

  function resetProgress(): ProgressState {
    return saveProgress(createEmptyProgress());
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return {
    getProgress,
    isLessonCompleted,
    toggleLessonCompletion,
    markLessonCompleted,
    saveQuizAttempt,
    saveExerciseAttempt,
    getTrackStats,
    resetProgress,
    subscribe,
  };
}

export const progressService = createProgressService();

function hasMigratedForUser(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(window.localStorage.getItem(`${MIGRATION_FLAG_PREFIX}${userId}`));
  } catch {
    return false;
  }
}

function markMigratedForUser(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${MIGRATION_FLAG_PREFIX}${userId}`, new Date().toISOString());
  } catch {
    // Abaikan jika penyimpanan lokal diblokir
  }
}

export interface RemoteSyncResult {
  progress: ProgressState;
  migratedCount: number;
}

function isMissingRelationError(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  const msg = (err.message ?? '').toLowerCase();
  return (
    err.code === '42P01' ||
    err.code === 'PGRST205' ||
    (msg.includes('relation') && msg.includes('does not exist')) ||
    msg.includes('could not find the table')
  );
}

export async function fetchAndMigrateSupabaseProgress(userId: string): Promise<RemoteSyncResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { progress: progressService.getProgress(), migratedCount: 0 };
  }

  const [lessonRes, quizRes, exerciseRes] = await Promise.all([
    supabase
      .from('lesson_progress')
      .select('lesson_id, is_completed, completed_at')
      .eq('user_id', userId)
      .eq('is_completed', true),
    supabase
      .from('quiz_attempts')
      .select('lesson_id, score, total, answers, completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false }),
    supabase
      .from('exercise_attempts')
      .select('lesson_id, exercise_id, exercise_type, status, attempts_count, last_submission, passed_at, updated_at')
      .eq('user_id', userId),
  ]);

  if (lessonRes.error) {
    throw new Error(formatSupabaseError(lessonRes.error));
  }
  if (quizRes.error) {
    throw new Error(formatSupabaseError(quizRes.error));
  }
  const hasExerciseTable = !isMissingRelationError(exerciseRes.error);
  if (exerciseRes.error && hasExerciseTable) {
    throw new Error(formatSupabaseError(exerciseRes.error));
  }

  const remoteCompleted = new Set<string>(
    (lessonRes.data ?? []).map((row) => normalizeLessonId(String(row.lesson_id)))
  );
  const remoteQuizzes: Record<string, QuizAttemptRecord> = {};
  for (const row of quizRes.data ?? []) {
    const lessonId = normalizeLessonId(String(row.lesson_id));
    if (lessonId in remoteQuizzes) continue;
    remoteQuizzes[lessonId] = {
      score: Number(row.score),
      total: Number(row.total),
      answers:
        row.answers && typeof row.answers === 'object'
          ? (row.answers as Record<string, number>)
          : {},
      completedAt: String(row.completed_at ?? new Date().toISOString()),
    };
  }

  const remoteExercises: Record<string, ExerciseAttemptRecord> = {};
  if (hasExerciseTable) {
    for (const row of exerciseRes.data ?? []) {
      const lessonId = normalizeLessonId(String(row.lesson_id));
      const exerciseId = String(row.exercise_id);
      const key = buildExerciseKey(lessonId, exerciseId);
      remoteExercises[key] = {
        lessonId,
        exerciseId,
        exerciseType: (row.exercise_type as ExerciseType) ?? 'python',
        status: row.status === 'passed' ? 'passed' : 'attempted',
        attemptsCount: Number(row.attempts_count ?? 1),
        lastSubmission: String(row.last_submission ?? ''),
        passedAt: row.passed_at ? String(row.passed_at) : undefined,
        updatedAt: String(row.updated_at ?? new Date().toISOString()),
      };
    }
  }

  let migratedCount = 0;
  const localState = progressService.getProgress();

  if (!hasMigratedForUser(userId)) {
    if (hasLocalProgressToMigrate(localState)) {
      const { lessonRows, quizRows, exerciseRows } = buildMigrationPayloads(
        userId,
        localState,
        remoteCompleted,
        new Set(Object.keys(remoteQuizzes)),
        'excel-analisis-data',
        new Set(Object.keys(remoteExercises))
      );

      if (lessonRows.length > 0) {
        const { error: upsertLessonErr } = await supabase
          .from('lesson_progress')
          .upsert(lessonRows, { onConflict: 'user_id,lesson_id', ignoreDuplicates: true });
        if (upsertLessonErr) {
          throw new Error(formatSupabaseError(upsertLessonErr));
        }
        lessonRows.forEach((r) => remoteCompleted.add(r.lesson_id));
        migratedCount += lessonRows.length;
      }

      if (quizRows.length > 0) {
        const { error: upsertQuizErr } = await supabase
          .from('quiz_attempts')
          .upsert(quizRows);
        if (upsertQuizErr) {
          throw new Error(formatSupabaseError(upsertQuizErr));
        }
        quizRows.forEach((r) => {
          remoteQuizzes[r.lesson_id] = {
            score: r.score,
            total: r.total,
            answers: r.answers,
            completedAt: r.completed_at,
          };
        });
        migratedCount += quizRows.length;
      }

      if (hasExerciseTable && exerciseRows.length > 0) {
        const { error: upsertExErr } = await supabase
          .from('exercise_attempts')
          .upsert(exerciseRows, {
            onConflict: 'user_id,lesson_id,exercise_id',
            ignoreDuplicates: true,
          });
        if (upsertExErr && !isMissingRelationError(upsertExErr)) {
          throw new Error(formatSupabaseError(upsertExErr));
        }
        exerciseRows.forEach((r) => {
          const key = buildExerciseKey(r.lesson_id, r.exercise_id);
          remoteExercises[key] = {
            lessonId: r.lesson_id,
            exerciseId: r.exercise_id,
            exerciseType: r.exercise_type,
            status: r.status,
            attemptsCount: r.attempts_count,
            lastSubmission: r.last_submission,
            passedAt: r.passed_at ?? undefined,
            updatedAt: r.updated_at,
          };
        });
        migratedCount += exerciseRows.length;
      }

      if (migratedCount > 0) {
        await touchRemoteDailyStreak(userId).catch(() => undefined);
      }
    }

    markMigratedForUser(userId);
    progressService.resetProgress();
  }

  const remoteActivityLog: ActivityLogEntry[] = [];
  for (const row of lessonRes.data ?? []) {
    const lessonId = normalizeLessonId(String(row.lesson_id));
    if (row.completed_at) {
      remoteActivityLog.push({
        id: `lesson-${lessonId}-${String(row.completed_at)}`,
        kind: 'lesson',
        lessonId,
        title: `Menyelesaikan Pelajaran ${resolveLessonTitle(lessonId)}`,
        detail: '+50 XP',
        timestamp: String(row.completed_at),
      });
    }
  }
  for (const row of quizRes.data ?? []) {
    const lessonId = normalizeLessonId(String(row.lesson_id));
    const score = Number(row.score);
    const total = Number(row.total);
    const passed = total > 0 && score / total >= 0.7;
    if (row.completed_at) {
      remoteActivityLog.push({
        id: `quiz-${lessonId}-${String(row.completed_at)}`,
        kind: 'quiz',
        lessonId,
        title: `Kuis ${resolveLessonTitle(lessonId)}`,
        detail: `Skor ${score}/${total}${passed ? ' (Lulus +30 XP)' : ''}`,
        timestamp: String(row.completed_at),
      });
    }
  }
  for (const ex of Object.values(remoteExercises)) {
    const typeLabel =
      ex.exerciseType === 'python' ? 'Python' : ex.exerciseType === 'sql' ? 'SQL' : 'Grid Excel';
    remoteActivityLog.push({
      id: `ex-${ex.lessonId}:${ex.exerciseId}-${ex.updatedAt}`,
      kind: 'exercise',
      lessonId: ex.lessonId,
      title: `Latihan ${typeLabel} (${resolveLessonTitle(ex.lessonId)})`,
      detail: ex.status === 'passed' ? 'Jawaban benar (+20 XP)' : 'Percobaan dicatat',
      timestamp: ex.passedAt ?? ex.updatedAt,
    });
  }

  return {
    progress: {
      completedLessons: Array.from(remoteCompleted),
      quizAttempts: remoteQuizzes,
      exerciseAttempts: remoteExercises,
      activityLog: remoteActivityLog,
      updatedAt: new Date().toISOString(),
    },
    migratedCount,
  };
}

export async function setRemoteLessonCompletion(
  userId: string,
  lessonId: string,
  completed: boolean,
  trackSlug = 'excel-analisis-data'
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const canonicalId = normalizeLessonId(lessonId);

  if (completed) {
    const { error } = await supabase.from('lesson_progress').upsert(
      {
        user_id: userId,
        track_slug: trackSlug,
        lesson_id: canonicalId,
        is_completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id' }
    );
    if (error) throw new Error(formatSupabaseError(error));
    await touchRemoteDailyStreak(userId).catch(() => undefined);
  } else {
    const legacyMatch = /^excel-0(\d)$/.exec(canonicalId);
    const idsToDelete = legacyMatch ? [canonicalId, `excel-${legacyMatch[1]}`] : [canonicalId];
    const { error } = await supabase
      .from('lesson_progress')
      .delete()
      .eq('user_id', userId)
      .in('lesson_id', idsToDelete);
    if (error) throw new Error(formatSupabaseError(error));
  }
}

export async function saveRemoteQuizAttempt(
  userId: string,
  lessonId: string,
  score: number,
  total: number,
  answers: Record<string, number>
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const canonicalId = normalizeLessonId(lessonId);

  // Cari id baris terakhir untuk (user_id, lesson_id) agar upsert memperbarui baris tanpa bergantung pada unique constraint tambahan
  const { data: existing, error: lookupErr } = await supabase
    .from('quiz_attempts')
    .select('id')
    .eq('user_id', userId)
    .eq('lesson_id', canonicalId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupErr) throw new Error(formatSupabaseError(lookupErr));

  const payload = {
    ...(existing?.id ? { id: String(existing.id) } : {}),
    user_id: userId,
    lesson_id: canonicalId,
    score,
    total,
    answers,
    completed_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('quiz_attempts')
    .upsert(payload, { onConflict: 'id' });

  if (error) throw new Error(formatSupabaseError(error));
  await touchRemoteDailyStreak(userId).catch(() => undefined);
}

export async function saveRemoteExerciseAttempt(
  userId: string,
  record: ExerciseAttemptRecord
): Promise<{ usedLocalFallback: boolean }> {
  if (!isSupabaseConfigured || !supabase) {
    return { usedLocalFallback: true };
  }

  const { error } = await supabase.from('exercise_attempts').upsert(
    {
      user_id: userId,
      lesson_id: normalizeLessonId(record.lessonId),
      exercise_id: record.exerciseId,
      exercise_type: record.exerciseType,
      status: record.status,
      attempts_count: record.attemptsCount,
      last_submission: record.lastSubmission.slice(0, 2000),
      passed_at: record.passedAt ?? null,
      updated_at: record.updatedAt,
    },
    { onConflict: 'user_id,lesson_id,exercise_id' }
  );

  if (error) {
    if (isMissingRelationError(error)) {
      // Fallback aman bila tabel exercise_attempts belum dibuat di Supabase SQL Editor
      progressService.saveExerciseAttempt(
        record.lessonId,
        record.exerciseId,
        record.exerciseType,
        record.status === 'passed',
        record.lastSubmission
      );
      return { usedLocalFallback: true };
    }
    throw new Error(formatSupabaseError(error));
  }

  await touchRemoteDailyStreak(userId).catch(() => undefined);
  return { usedLocalFallback: false };
}

export async function touchRemoteDailyStreak(userId: string): Promise<StreakState | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const todayIso = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak, last_activity_date')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(formatSupabaseError(error));

  const next = calculateNextStreak(
    {
      currentStreak: Number(data?.current_streak ?? 0),
      longestStreak: Number(data?.longest_streak ?? 0),
      lastActivityDate: data?.last_activity_date ? String(data.last_activity_date) : null,
    },
    todayIso
  );

  const { error: upsertErr } = await supabase.from('streaks').upsert(
    {
      user_id: userId,
      current_streak: next.currentStreak,
      longest_streak: next.longestStreak,
      last_activity_date: next.lastActivityDate,
    },
    { onConflict: 'user_id' }
  );

  if (upsertErr) throw new Error(formatSupabaseError(upsertErr));
  return next;
}

export async function fetchRemoteEarnedBadges(userId: string): Promise<EarnedBadgeMap> {
  const localBadges = readLocalBadges();
  if (!isSupabaseConfigured || !supabase) return localBadges;

  const { data, error } = await supabase
    .from('user_badges')
    .select('badge_id, earned_at')
    .eq('user_id', userId);

  if (error) {
    if (isMissingRelationError(error)) {
      return localBadges;
    }
    throw new Error(formatSupabaseError(error));
  }

  const merged: EarnedBadgeMap = { ...localBadges };
  for (const row of data ?? []) {
    const id = String(row.badge_id);
    const earnedAt = row.earned_at ? String(row.earned_at) : new Date().toISOString();
    if (!merged[id]) {
      merged[id] = earnedAt;
    }
  }
  writeLocalBadges(merged);
  return merged;
}

export async function syncRemoteGamification(
  userId: string,
  xp: number,
  totalLessonsCompleted: number,
  earnedBadges: EarnedBadgeMap,
  completedTracks: string[] = []
): Promise<void> {
  writeLocalBadges(earnedBadges);
  if (!isSupabaseConfigured || !supabase) return;

  // 1. Perbarui xp, total_lessons_completed, dan completed_tracks pada profiles (abaikan aman jika kolom belum ada)
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({
      xp,
      total_lessons_completed: totalLessonsCompleted,
      completed_tracks: completedTracks,
    })
    .eq('id', userId);

  if (profileErr && (profileErr.code === '42703' || profileErr.code === 'PGRST204')) {
    await supabase
      .from('profiles')
      .update({
        xp,
        total_lessons_completed: totalLessonsCompleted,
      })
      .eq('id', userId);
  }

  // 2. Simpan user_badges ke Supabase bila tabel sudah ada
  const badgeRows = Object.entries(earnedBadges).map(([badgeId, earnedAt]) => ({
    user_id: userId,
    badge_id: badgeId,
    earned_at: earnedAt,
  }));

  if (badgeRows.length > 0) {
    const { error: badgeErr } = await supabase
      .from('user_badges')
      .upsert(badgeRows, { onConflict: 'user_id,badge_id', ignoreDuplicates: true });

    if (badgeErr && !isMissingRelationError(badgeErr)) {
      throw new Error(formatSupabaseError(badgeErr));
    }
  }
}
