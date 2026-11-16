import { Link } from 'react-router-dom';
import { Award, Cloud, Flame, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BADGE_DEFINITIONS } from '../lib/gamification';
import { BadgesGrid } from '../components/gamification/BadgesGrid';
import { usePageMeta } from '../lib/seo';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';

export function AchievementsPage() {
  usePageMeta({
    title: 'Pencapaian & Lencana | DataPath',
    description:
      'Kumpulkan XP, jaga streak belajar harian, dan buka seluruh lencana pencapaian DataPath.',
  });

  const { xpBreakdown, streak, earnedBadges, storageMode } = useAuth();
  const unlockedCount = BADGE_DEFINITIONS.filter((b) => Boolean(earnedBadges[b.id])).length;

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="default">
            <Cloud className="mr-1 h-3 w-3" aria-hidden="true" />
            {storageMode === 'supabase' ? 'Tersinkron ke Supabase' : 'Mode Browser Lokal'}
          </Badge>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Pencapaian & Lencana
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Kumpulkan XP dari setiap pelajaran, kuis, latihan interaktif, dan jaga streak belajar harian Anda.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400"
        >
          ← Kembali ke Dashboard
        </Link>
      </div>

      {/* Ringkasan XP, Streak, & Jumlah Badge */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total XP Anda</p>
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums dark:text-slate-50">
            {xpBreakdown.totalXp} XP
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums dark:text-slate-400">
            Materi +{xpBreakdown.lessonXp} · Kuis +{xpBreakdown.quizXp} · Latihan +{xpBreakdown.exerciseXp} · Streak +{xpBreakdown.streakBonusXp}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Streak Belajar</p>
            <Flame className="h-4 w-4 text-amber-500" aria-hidden="true" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums dark:text-slate-50">
            🔥 {streak.currentStreak} Hari
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums dark:text-slate-400">
            Rekor terpanjang: {streak.longestStreak} hari (bonus +100 XP di hari ke-7)
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Lencana Terbuka</p>
            <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums dark:text-slate-50">
            {unlockedCount} / {BADGE_DEFINITIONS.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Lencana terkunci menampilkan syarat untuk membukanya
          </p>
        </Card>
      </div>

      {/* Daftar Lencana */}
      <div className="mt-8">
        <BadgesGrid earnedBadges={earnedBadges} />
      </div>
    </section>
  );
}
