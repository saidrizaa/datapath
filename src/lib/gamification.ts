import type { ProgressState } from '../services/progressService';
import type { StreakState } from './progressMigration';
import { normalizeCompletedLessons } from './progressMigration';
import type { TrackItem } from '../data/curriculum';

export interface ActivityLogEntry {
  id: string;
  kind: 'lesson' | 'quiz' | 'exercise';
  lessonId: string;
  title: string;
  detail: string;
  timestamp: string;
}

export interface XpBreakdown {
  lessonXp: number;
  quizXp: number;
  exerciseXp: number;
  streakBonusXp: number;
  portfolioXp: number;
  totalXp: number;
  passedQuizzesCount: number;
  passedExercisesCount: number;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  requirement: string;
  iconName: 'footprints' | 'flame' | 'award' | 'trophy' | 'code' | 'calendar' | 'database' | 'briefcase';
}

export interface EarnedBadgeMap {
  [badgeId: string]: string; // ISO earned_at
}

export interface WeeklyActivityPoint {
  dateIso: string;
  label: string;
  count: number;
}

export interface TrackProgressSummary {
  track: TrackItem;
  completedCount: number;
  totalCount: number;
  percentage: number;
  remainingMinutes: number;
}

export interface RecommendedLessonItem {
  id: string;
  slug?: string;
  title: string;
  trackTitle: string;
  durationMinutes: number;
  practiceType: string;
  available: boolean;
}

export const TRACK1_LESSON_IDS = [
  'excel-01',
  'excel-02',
  'excel-03',
  'excel-04',
  'excel-05',
] as const;

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'langkah-pertama',
    title: 'Langkah Pertama',
    description: 'Menyelesaikan pelajaran pertama di DataPath.',
    requirement: 'Selesaikan minimal 1 pelajaran',
    iconName: 'footprints',
  },
  {
    id: 'konsisten',
    title: 'Konsisten',
    description: 'Menjaga ritme belajar selama 3 hari berturut-turut.',
    requirement: 'Capai streak belajar 3 hari berturut-turut',
    iconName: 'calendar',
  },
  {
    id: 'seminggu-berturut',
    title: 'Seminggu Berturut',
    description: 'Berhasil mempertahankan kebiasaan belajar penuh selama sepekan.',
    requirement: 'Capai streak belajar 7 hari berturut-turut',
    iconName: 'flame',
  },
  {
    id: 'kuis-sempurna',
    title: 'Kuis Sempurna',
    description: 'Menjawab seluruh soal kuis dengan benar tanpa kesalahan.',
    requirement: 'Raih skor 100% di kuis pelajaran mana pun',
    iconName: 'trophy',
  },
  {
    id: 'penjelajah-data',
    title: 'Penjelajah Data',
    description: 'Menjalankan kode Python pertama langsung di browser.',
    requirement: 'Coba latihan Editor Python minimal 1 kali',
    iconName: 'code',
  },
  {
    id: 'praktisi-sql',
    title: 'Praktisi SQL',
    description: 'Berhasil mengeksekusi dan memecahkan kueri SQL dataset penjualan.',
    requirement: 'Selesaikan latihan SQL hingga berstatus benar',
    iconName: 'database',
  },
  {
    id: 'master-excel',
    title: 'Master Excel',
    description: 'Menuntaskan seluruh fondasi Excel untuk Analisis Data.',
    requirement: 'Selesaikan semua 5 pelajaran di Track 1: Excel',
    iconName: 'award',
  },
  {
    id: 'portofolio-perdana',
    title: 'Portofolio Perdana',
    description: 'Mempublikasikan studi kasus proyek analisis data pertama ke portofolio publik (+50 XP).',
    requirement: 'Publikasikan minimal 1 proyek portofolio',
    iconName: 'briefcase',
  },
];

export function calculateXpBreakdown(
  progress: ProgressState,
  streak: StreakState,
  publishedProjectsCount = 0
): XpBreakdown {
  const completedLessons = normalizeCompletedLessons(progress.completedLessons);
  const lessonXp = completedLessons.length * 50;

  let passedQuizzesCount = 0;
  for (const attempt of Object.values(progress.quizAttempts ?? {})) {
    if (attempt && attempt.total > 0 && attempt.score / attempt.total >= 0.7) {
      passedQuizzesCount += 1;
    }
  }
  const quizXp = passedQuizzesCount * 30;

  let passedExercisesCount = 0;
  for (const ex of Object.values(progress.exerciseAttempts ?? {})) {
    if (ex && ex.status === 'passed') {
      passedExercisesCount += 1;
    }
  }
  const exerciseXp = passedExercisesCount * 20;

  const bestStreak = Math.max(streak.currentStreak || 0, streak.longestStreak || 0);
  const streakBonusXp = bestStreak >= 7 ? 100 : 0;
  const portfolioXp = publishedProjectsCount >= 1 ? 50 : 0;

  return {
    lessonXp,
    quizXp,
    exerciseXp,
    streakBonusXp,
    portfolioXp,
    totalXp: lessonXp + quizXp + exerciseXp + streakBonusXp + portfolioXp,
    passedQuizzesCount,
    passedExercisesCount,
  };
}

export function isBadgeCriteriaMet(
  badgeId: string,
  progress: ProgressState,
  streak: StreakState,
  publishedProjectsCount = 0
): boolean {
  const completedSet = new Set(normalizeCompletedLessons(progress.completedLessons));
  const bestStreak = Math.max(streak.currentStreak || 0, streak.longestStreak || 0);
  const quizzes = Object.values(progress.quizAttempts ?? {});
  const exercises = Object.values(progress.exerciseAttempts ?? {});

  switch (badgeId) {
    case 'langkah-pertama':
      return completedSet.size >= 1;
    case 'konsisten':
      return bestStreak >= 3;
    case 'seminggu-berturut':
      return bestStreak >= 7;
    case 'kuis-sempurna':
      return quizzes.some((q) => q && q.total > 0 && q.score === q.total);
    case 'penjelajah-data':
      return exercises.some((e) => e && e.exerciseType === 'python');
    case 'praktisi-sql':
      return exercises.some((e) => e && e.exerciseType === 'sql' && e.status === 'passed');
    case 'master-excel':
      return TRACK1_LESSON_IDS.every((id) => completedSet.has(id));
    case 'portofolio-perdana':
      return publishedProjectsCount >= 1;
    default:
      return false;
  }
}

export function evaluateUnlockedBadges(
  progress: ProgressState,
  streak: StreakState,
  existingEarned: EarnedBadgeMap = {},
  nowIso: string = new Date().toISOString(),
  publishedProjectsCount = 0
): { earnedMap: EarnedBadgeMap; newlyUnlockedIds: string[] } {
  const earnedMap: EarnedBadgeMap = { ...existingEarned };
  const newlyUnlockedIds: string[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    const alreadyEarned = Boolean(earnedMap[badge.id]);
    if (!alreadyEarned && isBadgeCriteriaMet(badge.id, progress, streak, publishedProjectsCount)) {
      earnedMap[badge.id] = nowIso;
      newlyUnlockedIds.push(badge.id);
    }
  }

  return { earnedMap, newlyUnlockedIds };
}

const SHORT_DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function buildWeeklyActivitySeries(
  entries: ActivityLogEntry[],
  referenceDate: Date = new Date()
): WeeklyActivityPoint[] {
  const countsByDate = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.timestamp) continue;
    const dateKey = entry.timestamp.slice(0, 10);
    countsByDate.set(dateKey, (countsByDate.get(dateKey) ?? 0) + 1);
  }

  const points: WeeklyActivityPoint[] = [];
  const baseUtc = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  );

  for (let offset = 6; offset >= 0; offset -= 1) {
    const d = new Date(baseUtc - offset * 86400000);
    const dateIso = d.toISOString().slice(0, 10);
    const dayName = SHORT_DAYS_ID[d.getUTCDay()];
    const dayNum = d.getUTCDate();
    points.push({
      dateIso,
      label: `${dayName} ${dayNum}`,
      count: countsByDate.get(dateIso) ?? 0,
    });
  }

  return points;
}

export function getRecentActivities(
  entries: ActivityLogEntry[],
  limit = 10
): ActivityLogEntry[] {
  return [...entries]
    .filter((item) => Boolean(item && item.timestamp))
    .sort((a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0))
    .slice(0, limit);
}

export function formatRemainingDuration(minutes: number): string {
  if (minutes <= 0) return 'Selesai';
  if (minutes < 60) return `Sisa ± ${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `Sisa ± ${hours} jam ${rem} mnt` : `Sisa ± ${hours} jam`;
}

export function buildTrackProgressSummaries(
  tracks: TrackItem[],
  completedLessons: string[]
): TrackProgressSummary[] {
  const completedSet = new Set(normalizeCompletedLessons(completedLessons));

  return tracks.map((track) => {
    const lessonIds = track.starterLessons.map((l) => l.id);
    const totalCount = lessonIds.length;
    const completedCount = lessonIds.filter((id) => completedSet.has(id)).length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    let remainingMinutes = 0;
    if (track.status === 'available') {
      remainingMinutes = track.starterLessons
        .filter((l) => !completedSet.has(l.id))
        .reduce((acc, l) => acc + l.durationMinutes, 0);
    } else {
      remainingMinutes = track.durationHours * 60;
    }

    return {
      track,
      completedCount,
      totalCount,
      percentage,
      remainingMinutes,
    };
  });
}

export function getRecommendedLessons(
  tracks: TrackItem[],
  completedLessons: string[],
  limit = 3
): RecommendedLessonItem[] {
  const completedSet = new Set(normalizeCompletedLessons(completedLessons));
  const activeTracks = tracks.filter((t) => t.status === 'available');
  const results: RecommendedLessonItem[] = [];

  for (const track of activeTracks) {
    for (const lesson of track.starterLessons) {
      if (!completedSet.has(lesson.id)) {
        results.push({
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          trackTitle: track.title,
          durationMinutes: lesson.durationMinutes,
          practiceType: lesson.practiceType,
          available: true,
        });
        if (results.length >= limit) return results;
      }
    }
  }

  return results;
}
