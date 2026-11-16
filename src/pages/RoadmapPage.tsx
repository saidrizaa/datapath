import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, Clock, Layers, Search } from 'lucide-react';
import { TRACKS } from '../data/curriculum';
import { EXCEL_LESSONS } from '../data/excelLessons';
import { filterTracks, type LevelFilter } from '../lib/roadmapFilter';
import { useProgress } from '../hooks/useProgress';
import { usePageMeta } from '../lib/seo';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Progress } from '../components/ui/progress';

const LEVEL_FILTERS: { label: string; value: LevelFilter }[] = [
  { label: 'Semua Level', value: 'Semua' },
  { label: 'Pemula', value: 'Pemula' },
  { label: 'Menengah', value: 'Menengah' },
  { label: 'Lanjut', value: 'Lanjut' },
];

export function RoadmapPage() {
  usePageMeta({
    title: 'Roadmap Belajar Analisis Data | DataPath',
    description:
      'Jelajahi peta kurikulum 8 jalur analisis data berbahasa Indonesia dari Excel, SQL, Python, pandas, statistik, machine learning, hingga big data.',
  });

  const [level, setLevel] = useState<LevelFilter>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const { getTrackStats, isCompleted, storageMode } = useProgress();

  const visibleTracks = useMemo(
    () => filterTracks(TRACKS, level, searchQuery),
    [level, searchQuery]
  );

  const excelLessonIds = useMemo(() => EXCEL_LESSONS.map((l) => l.id), []);
  const excelStats = getTrackStats(excelLessonIds);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="flex flex-col gap-6 border-b border-slate-200 pb-8 dark:border-slate-800 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
            Kurikulum Lengkap DataPath
          </p>
          <h1
            className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl"
            style={{ textWrap: 'balance' }}
          >
            Roadmap Belajar Analisis Data (8 Jalur)
          </h1>
          <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Track 1 (Excel) telah tersedia penuh dengan 5 pelajaran MDX, dataset transaksi 500 baris, dan kuis evaluasi. Jalur 2 hingga 8 berstatus segera hadir pada fase berikutnya.
          </p>
        </div>

        <Card className="w-full p-4 md:w-72 shrink-0">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
            <span>Progres Track 1: Excel</span>
            <span className="font-mono tabular-nums">
              {excelStats.completedCount}/{excelStats.totalCount} selesai
            </span>
          </div>
          <Progress
            value={excelStats.percentage}
            label="Progres belajar Track 1 Excel"
            className="mt-2.5"
          />
          <p className="mt-2 text-xs text-slate-500 tabular-nums dark:text-slate-400">
            {excelStats.percentage}% selesai ·{' '}
            {storageMode === 'supabase' ? 'Tersimpan di akun Supabase' : 'Tersimpan di browser ini'}
          </p>
        </Card>
      </div>

      {/* Filter & Pencarian */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="group"
          aria-label="Filter jalur berdasarkan tingkat kesulitan"
          className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900"
        >
          {LEVEL_FILTERS.map((item) => {
            const isActive = level === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setLevel(item.value)}
                aria-pressed={isActive}
                className={`min-h-10 rounded-md px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <label htmlFor="full-roadmap-search" className="sr-only">
            Cari jalur atau topik
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="full-roadmap-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari jalur atau topik..."
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Daftar 8 Track */}
      <div className="mt-8 space-y-6">
        {visibleTracks.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Tidak ada jalur yang cocok dengan filter saat ini.
            </p>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLevel('Semua');
                  setSearchQuery('');
                }}
              >
                Reset Filter
              </Button>
            </div>
          </Card>
        ) : (
          visibleTracks.map((track) => {
            const isAvailable = track.status === 'available';

            return (
              <Card
                key={track.id}
                className={`p-6 ${
                  isAvailable
                    ? 'border-blue-300 dark:border-blue-900'
                    : ''
                }`}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-xs font-medium text-slate-500 tabular-nums dark:text-slate-400">
                        Track {String(track.order).padStart(2, '0')} · {track.level}
                      </span>
                      <Badge variant={isAvailable ? 'default' : 'secondary'}>
                        {isAvailable ? '5 Pelajaran Lengkap' : 'Segera hadir'}
                      </Badge>
                    </div>

                    <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {track.title}
                    </h2>

                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {track.summary}
                    </p>

                    <div className="flex flex-wrap gap-5 pt-1 text-xs text-slate-500 tabular-nums dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        Estimasi ± {track.durationHours} Jam
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                        {track.moduleCount} Modul
                      </span>
                      <span>Proyek Mini: {track.miniProject}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <Link
                      to={`/roadmap/${track.slug}`}
                      className={
                        isAvailable
                          ? 'inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500'
                          : 'inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                      }
                    >
                      <BookOpen className="h-4 w-4" aria-hidden="true" />
                      <span>{isAvailable ? 'Buka Pelajaran Track 1' : 'Lihat Kerangka'}</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                {/* Daftar cepat 5 pelajaran langsung pada Track 1 */}
                {isAvailable && (
                  <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      {EXCEL_LESSONS.map((lesson) => {
                        const done = isCompleted(lesson.id);
                        return (
                          <Link
                            key={lesson.id}
                            to={`/belajar/excel/${lesson.slug}`}
                            className={`flex flex-col justify-between rounded-lg border p-3.5 transition-colors ${
                              done
                                ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 dark:border-emerald-900/70 dark:bg-emerald-950/20'
                                : 'border-slate-200 bg-slate-50/60 hover:border-blue-300 hover:bg-blue-50/30 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-800'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                                0{lesson.order}
                              </span>
                              {done && (
                                <CheckCircle2
                                  className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                                  aria-label="Selesai"
                                />
                              )}
                            </div>
                            <p className="mt-2 text-xs font-semibold leading-snug text-slate-900 dark:text-slate-100">
                              {lesson.title}
                            </p>
                            <p className="mt-2 text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
                              ± {lesson.durationMinutes} menit
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </section>
  );
}
