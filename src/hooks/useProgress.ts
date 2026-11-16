import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  buildExerciseKey,
  normalizeCompletedLessons,
  normalizeLessonId,
  type ExerciseType,
} from '../lib/progressMigration';

// Hook reaktif untuk membaca dan memperbarui progres belajar.
// Otomatis memakai Supabase saat login (dengan migrasi 1x dari localStorage),
// atau fallback ke localStorage saat mode tamu / Supabase belum dikonfigurasi.
export function useProgress() {
  const {
    progress,
    streak,
    xpBreakdown,
    earnedBadges,
    storageMode,
    syncError,
    migrationNotice,
    dismissMigrationNotice,
    clearSyncError,
    toggleLessonComplete,
    saveQuizAttempt,
    saveExerciseAttempt,
  } = useAuth();

  const toggleComplete = useCallback(
    (lessonId: string) => {
      void toggleLessonComplete(lessonId);
    },
    [toggleLessonComplete]
  );

  const saveQuiz = useCallback(
    (lessonId: string, score: number, total: number, answers: Record<string, number>) => {
      void saveQuizAttempt(lessonId, score, total, answers);
    },
    [saveQuizAttempt]
  );

  const saveExercise = useCallback(
    (
      lessonId: string,
      exerciseId: string,
      exerciseType: ExerciseType,
      passed: boolean,
      lastSubmission: string
    ) => {
      void saveExerciseAttempt(lessonId, exerciseId, exerciseType, passed, lastSubmission);
    },
    [saveExerciseAttempt]
  );

  return {
    progress,
    streak,
    xpBreakdown,
    earnedBadges,
    storageMode,
    syncError,
    migrationNotice,
    dismissMigrationNotice,
    clearSyncError,
    toggleComplete,
    saveQuiz,
    saveExercise,
    getExerciseAttempt: (lessonId: string, exerciseId: string) =>
      progress.exerciseAttempts?.[buildExerciseKey(lessonId, exerciseId)],
    isCompleted: (lessonId: string) =>
      normalizeCompletedLessons(progress.completedLessons).includes(normalizeLessonId(lessonId)),
    getTrackStats: (lessonIds: string[]) => {
      const completedSet = new Set(normalizeCompletedLessons(progress.completedLessons));
      const canonicalIds = normalizeCompletedLessons(lessonIds);
      const totalCount = canonicalIds.length;
      const completedCount = canonicalIds.filter((id) => completedSet.has(id)).length;
      const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      return { completedCount, totalCount, percentage };
    },
  };
}
