import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock,
  Cloud,
  Code2,
  ExternalLink,
  Flame,
  FolderPlus,
  History,
  NotebookPen,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../hooks/useProgress';
import { EXCEL_LESSONS } from '../data/excelLessons';
import { TRACKS } from '../data/curriculum';
import {
  buildTrackProgressSummaries,
  buildWeeklyActivitySeries,
  formatRemainingDuration,
  getRecentActivities,
  getRecommendedLessons,
} from '../lib/gamification';
import type { PortfolioProject } from '../lib/portfolio';
import { fetchUserProjects } from '../services/portfolioService';
import { usePageMeta } from '../lib/seo';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Progress } from '../components/ui/progress';

function formatActivityTime(iso: string): string {
  const ts = Date.parse(iso);
  if (!ts) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts));
}

export function DashboardPage() {
  usePageMeta({
    title: 'Dashboard Belajar | DataPath',
    description: 'Pantau progres kurikulum, statistik XP, streak belajar, dan daftar proyek portofolio Anda di DataPath.',
    noIndex: true,
  });

  const { user, profile, streak, xpBreakdown } = useAuth();
  const {
    progress,
    storageMode,
    syncError,
    migrationNotice,
    dismissMigrationNotice,
    clearSyncError,
    getTrackStats,
  } = useProgress();

  const [recentProjects, setRecentProjects] = useState<PortfolioProject[]>([]);

  useEffect(() => {
    let active = true;
    const load = () => {
      fetchUserProjects(user?.id)
        .then((res) => {
          if (active) setRecentProjects(res.projects.slice(0, 3));
        })
        .catch(() => {
          if (active) setRecentProjects([]);
        });
    };
    load();
    window.addEventListener('datapath-projects-changed', load);
    return () => {
      active = false;
      window.removeEventListener('datapath-projects-changed', load);
    };
  }, [user?.id]);

  const excelStats = getTrackStats(EXCEL_LESSONS.map((l) => l.id));
  const trackSummaries = buildTrackProgressSummaries(TRACKS, progress.completedLessons);
  const recommendations = getRecommendedLessons(TRACKS, progress.completedLessons, 3);
  const weeklySeries = buildWeeklyActivitySeries(progress.activityLog ?? []);
  const recentActivities = getRecentActivities(progress.activityLog ?? [], 10);

  const quizEntries = EXCEL_LESSONS.map((lesson) => progress.quizAttempts[lesson.id]).filter(
    (record): record is NonNullable<typeof record> => Boolean(record)
  );
  const averageQuizPercentage =
    quizEntries.length > 0
      ? Math.round(
          quizEntries.reduce(
            (acc, record) => acc + (record.total > 0 ? (record.score / record.total) * 100 : 0),
            0
          ) / quizEntries.length
        )
      : 0;

  const displayName =
    profile?.fullName ||
    String(user?.user_metadata?.full_name ?? '') ||
    user?.email?.split('@')[0] ||
    'Pembelajar';

  const getTrackTitle = (slug: string) =>
    TRACKS.find((t) => t.slug === slug)?.title ?? 'Analisis Data';

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      {/* Notifikasi Migrasi Progres Lokal ke Supabase */}
      {migrationNotice && (
        <div
          role="status"
          className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{migrationNotice}</p>
          </div>
          <button
            type="button"
            onClick={dismissMigrationNotice}
            aria-label="Tutup pemberitahuan migrasi"
            className="rounded p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Notifikasi Error Sinkronisasi / Jaringan */}
      {syncError && (
        <div
          role="alert"
          className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{syncError}</p>
          </div>
          <button
            type="button"
            onClick={clearSyncError}
            aria-label="Tutup pesan kesalahan"
            className="rounded p-1 hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Header Dashboard */}
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="default">
              <Cloud className="mr-1 h-3 w-3" aria-hidden="true" />
              {storageMode === 'supabase' ? 'Tersinkron ke Supabase' : 'Mode Browser Lokal'}
            </Badge>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {profile?.targetRole || 'Junior Data Analyst'}
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Halo, {displayName}
          </h1>
          <p className="max-w-xl text-sm text-slate-600 dark:text-slate-300">
            {storageMode === 'local'
              ? 'Progres, XP, streak, dan catatan Anda tersimpan otomatis di browser. Masuk akun untuk sinkronisasi lintas perangkat.'
              : profile?.headline || 'Pantau progres belajar, aktivitas mingguan, XP, dan pencapaian Anda.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 md:shrink-0">
          <Link
            to="/catatan"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <NotebookPen className="h-4 w-4" aria-hidden="true" />
            <span>Catatan</span>
          </Link>
          <Link
            to="/pencapaian"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Award className="h-4 w-4" aria-hidden="true" />
            <span>Pencapaian</span>
          </Link>
          <Link
            to="/profil"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <User className="h-4 w-4" aria-hidden="true" />
            <span>Profil</span>
          </Link>
          {!user && (
            <Link
              to="/masuk"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <span>Masuk / Sinkron</span>
            </Link>
          )}
        </div>
      </div>

      {/* 4 Kartu Statistik */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total XP</p>
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums dark:text-slate-50">
            {xpBreakdown.totalXp} XP
          </p>
          <p className="mt-2 text-xs text-slate-500 tabular-nums dark:text-slate-400">
            +50/materi · +30/kuis · +20/latihan · +50/portofolio
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Streak Hari Ini
            </p>
            <Flame className="h-4 w-4 text-amber-500" aria-hidden="true" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums dark:text-slate-50">
            🔥 {streak.currentStreak} Hari
          </p>
          <p className="mt-2 text-xs text-slate-500 tabular-nums dark:text-slate-400">
            Rekor terpanjang: {streak.longestStreak} hari
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Pelajaran Selesai
            </p>
            <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums dark:text-slate-50">
            {excelStats.completedCount} / {excelStats.totalCount}
          </p>
          <Progress value={excelStats.percentage} label="Progres Pelajaran Track 1" className="mt-2.5" />
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Rata-rata Skor Kuis
            </p>
            <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums dark:text-slate-50">
            {quizEntries.length > 0 ? `${averageQuizPercentage}%` : 'Belum ada'}
          </p>
          <p className="mt-2 text-xs text-slate-500 tabular-nums dark:text-slate-400">
            {quizEntries.length} dari {EXCEL_LESSONS.length} kuis dikerjakan
          </p>
        </Card>
      </div>

      {/* CTA Proyek Portofolio setelah Track 1: Excel 100% selesai */}
      {excelStats.percentage === 100 && (
        <Card className="mt-8 border-blue-200 bg-blue-50/70 p-6 dark:border-blue-900/60 dark:bg-blue-950/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Track 1: Excel Selesai 100%</span>
              </p>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
                Waktunya Dokumentasikan Proyek Excel Anda
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Ubah hasil latihan dashboard dan analisis penjualan menjadi studi kasus publik yang siap ditinjau rekruter (+50 XP saat dipublikasikan).
              </p>
            </div>
            <Link
              to="/proyek?new=1&track=excel-analisis-data"
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <span>Buat Proyek Portfolio Track Excel →</span>
            </Link>
          </div>
        </Card>
      )}

      {/* Baris Utama: Grafik Aktivitas Mingguan & Rekomendasi Pelajaran */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          {/* Grafik Recharts Aktivitas 7 Hari Terakhir */}
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
                  Aktivitas Belajar 7 Hari Terakhir
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Jumlah pelajaran, kuis, dan latihan yang diselesaikan per hari
                </p>
              </div>
              <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                7 Hari
              </span>
            </div>

            <div className="mt-5 h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklySeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.4} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(37, 99, 235, 0.08)' }}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`${String(value ?? 0)} aktivitas`, 'Selesai']}
                  />
                  <Bar
                    dataKey="count"
                    name="Aktivitas"
                    fill="#1d4ed8"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Rekomendasi 1–3 Pelajaran Berikutnya */}
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
                  Rekomendasi Pelajaran Berikutnya
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Pelajaran yang belum diselesaikan dari track aktif Anda
                </p>
              </div>
              <Link
                to="/roadmap/excel-analisis-data"
                className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
              >
                Semua Materi
              </Link>
            </div>

            {recommendations.length > 0 ? (
              <div className="mt-4 space-y-3">
                {recommendations.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                        {item.trackTitle}
                      </p>
                      <h3 className="mt-0.5 font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </h3>
                      <p className="mt-1 flex items-center gap-3 text-xs text-slate-500 tabular-nums dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          ± {item.durationMinutes} menit
                        </span>
                        <span>·</span>
                        <span>{item.practiceType}</span>
                      </p>
                    </div>

                    <Link
                      to={item.slug ? `/belajar/excel/${item.slug}` : '/roadmap'}
                      className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                    >
                      <span>Lanjutkan</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                Selamat! Seluruh pelajaran pada Track 1: Excel sudah selesai. Anda dapat meninjau ulang materi atau memperdalam latihan Python & SQL.
              </div>
            )}
          </Card>

          {/* Riwayat Belajar (10 Aktivitas Terakhir) */}
          <Card className="p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
                  Riwayat Belajar Terakhir
                </h2>
              </div>
              <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
                Maks. 10 aktivitas
              </span>
            </div>

            {recentActivities.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Belum ada riwayat aktivitas. Selesaikan pelajaran, kuis, atau latihan interaktif untuk mulai mencatat progres Anda.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
                {recentActivities.map((act) => {
                  const Icon =
                    act.kind === 'lesson'
                      ? CheckCircle2
                      : act.kind === 'quiz'
                        ? Award
                        : Code2;
                  const iconColor =
                    act.kind === 'lesson'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : act.kind === 'quiz'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-amber-600 dark:text-amber-400';

                  return (
                    <li
                      key={act.id}
                      className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                            {act.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{act.detail}</p>
                        </div>
                      </div>
                      <span className="shrink-0 pl-6 font-mono text-[11px] text-slate-500 tabular-nums sm:pl-0 dark:text-slate-400">
                        {formatActivityTime(act.timestamp)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Kolom Kanan: Progres Per Track (8 Track + Estimasi Waktu Tersisa) */}
        <div className="space-y-6 lg:col-span-5">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
                Progres per Track
              </h2>
              <Link
                to="/roadmap"
                className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
              >
                Lihat Roadmap
              </Link>
            </div>

            <ul className="mt-5 space-y-5">
              {trackSummaries.map(({ track, completedCount, totalCount, percentage, remainingMinutes }) => {
                const isAvailable = track.status === 'available';
                return (
                  <li key={track.id} className="space-y-2">
                    <div className="flex items-start justify-between gap-2 text-xs">
                      <Link
                        to={`/roadmap/${track.slug}`}
                        className="font-semibold text-slate-800 hover:text-blue-700 dark:text-slate-200 dark:hover:text-blue-400"
                      >
                        {String(track.order).padStart(2, '0')}. {track.title}
                      </Link>
                      <span className="shrink-0 font-mono text-slate-600 tabular-nums dark:text-slate-300">
                        {percentage}%
                      </span>
                    </div>
                    <Progress value={percentage} label={`Progres ${track.title}`} />
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
                      <span>
                        {isAvailable
                          ? `${completedCount} / ${totalCount} pelajaran selesai`
                          : `0 / ${totalCount} pelajaran (Segera hadir)`}
                      </span>
                      <span>
                        {isAvailable
                          ? formatRemainingDuration(remainingMinutes)
                          : `Estimasi ± ${track.durationHours} jam`}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Bagian Proyek Saya (Maks. 3 Terbaru) */}
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
                  Proyek Saya
                </h2>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                {profile?.username && (
                  <Link
                    to={`/portofolio/${profile.username}`}
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-400"
                  >
                    <span>Portofolio</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </Link>
                )}
                <Link
                  to="/proyek"
                  className="text-blue-700 hover:underline dark:text-blue-400"
                >
                  Kelola Semua
                </Link>
              </div>
            </div>

            {recentProjects.length === 0 ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Belum ada proyek portofolio. Mulai susun studi kasus pertama Anda untuk membangun portofolio yang siap dilampirkan di CV.
                </p>
                <Link
                  to="/proyek?new=1"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <FolderPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Tambah Proyek</span>
                </Link>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800"
                  >
                    <span
                      className="mt-1 h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: project.thumbnailColor }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link
                          to={
                            profile?.username
                              ? `/portofolio/${profile.username}/${project.slug}`
                              : `/proyek?edit=${project.id}`
                          }
                          className="truncate text-sm font-semibold text-slate-900 hover:text-blue-700 dark:text-slate-100 dark:hover:text-blue-400"
                        >
                          {project.title}
                        </Link>
                        <span
                          className={`text-[11px] font-semibold ${
                            project.isPublished
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {project.isPublished ? 'Publik' : 'Draft'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {getTrackTitle(project.trackSlug)}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="pt-1">
                  <Link
                    to="/proyek?new=1"
                    className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
                  >
                    <FolderPlus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>+ Tambah Proyek Baru</span>
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
