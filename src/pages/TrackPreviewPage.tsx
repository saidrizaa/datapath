import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, Layers } from 'lucide-react';
import { TRACKS } from '../data/curriculum';
import { EXCEL_LESSONS } from '../data/excelLessons';
import { findTrackBySlug } from '../lib/roadmapFilter';
import { useProgress } from '../hooks/useProgress';
import { usePageMeta } from '../lib/seo';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Progress } from '../components/ui/progress';

export function TrackPreviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const track = findTrackBySlug(TRACKS, slug);
  const { isCompleted, getTrackStats } = useProgress();

  usePageMeta({
    title: track ? `${track.title} — Roadmap | DataPath` : 'Jalur Belajar Tidak Ditemukan | DataPath',
    description: track
      ? track.summary
      : 'Pelajari jalur kurikulum analisis data di DataPath mulai dari Track 1 Excel hingga Big Data.',
  });

  if (!track) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            Jalur belajar tidak ditemukan
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Silakan kembali ke halaman roadmap untuk melihat 8 jalur kurikulum DataPath.
          </p>
          <div className="mt-6">
            <Link
              to="/roadmap"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 dark:bg-blue-600"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Kembali ke Roadmap</span>
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  const isAvailable = track.status === 'available';
  const excelStats = getTrackStats(EXCEL_LESSONS.map((l) => l.id));

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <Link
        to="/roadmap"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>Kembali ke Roadmap 8 Jalur</span>
      </Link>

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs font-medium text-blue-700 tabular-nums dark:text-blue-400">
            Track {String(track.order).padStart(2, '0')} · {track.level}
          </span>
          <Badge variant={isAvailable ? 'default' : 'secondary'}>
            {isAvailable ? '5 Pelajaran Lengkap Tersedia' : 'Segera hadir'}
          </Badge>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {track.title}
        </h1>
        <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
          {track.summary}
        </p>

        <div className="flex flex-wrap gap-6 border-y border-slate-200 py-4 text-sm text-slate-700 tabular-nums dark:border-slate-800 dark:text-slate-300">
          <span className="inline-flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
            Estimasi {track.durationHours} Jam
          </span>
          <span className="inline-flex items-center gap-2">
            <Layers className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {track.moduleCount} Modul
          </span>
          <span className="inline-flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {track.starterLessons.length} Pelajaran
          </span>
        </div>
      </div>

      {isAvailable && (
        <Card className="mt-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <span>Progres Track 1 Anda</span>
            <span className="font-mono text-xs tabular-nums">
              {excelStats.completedCount} / {excelStats.totalCount} Pelajaran ({excelStats.percentage}%)
            </span>
          </div>
          <Progress value={excelStats.percentage} label="Progres Track 1 Excel" className="mt-3" />
        </Card>
      )}

      <Card className="mt-6 p-6">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
          {isAvailable
            ? 'Daftar Pelajaran Lengkap Track 1 (Excel)'
            : 'Kerangka Pelajaran (Segera Hadir)'}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {isAvailable
            ? 'Setiap pelajaran memuat tujuan, penjelasan orisinal, contoh, latihan dengan dataset 500 baris CSV, ringkasan, kuis 5 soal, dan sumber resmi.'
            : 'Materi jalur ini sedang disiapkan dan akan dibuka pada tahap pengembangan berikutnya.'}
        </p>

        <ol className="mt-5 divide-y divide-slate-200 dark:divide-slate-800">
          {isAvailable
            ? EXCEL_LESSONS.map((lesson) => {
                const done = isCompleted(lesson.id);
                return (
                  <li
                    key={lesson.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-slate-400 tabular-nums">
                          0{lesson.order}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {lesson.title}
                        </span>
                        {done && (
                          <Badge variant="success">
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            <span>Selesai</span>
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {lesson.moduleTitle} · ± {lesson.durationMinutes} menit
                      </p>
                    </div>

                    <Link
                      to={`/belajar/excel/${lesson.slug}`}
                      className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                    >
                      <span>{done ? 'Tinjau Pelajaran' : 'Mulai Pelajaran'}</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })
            : track.starterLessons.map((lesson, index) => (
                <li
                  key={lesson.id}
                  className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      <span className="mr-2 font-mono text-xs text-slate-400 tabular-nums">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {lesson.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Mode Latihan: {lesson.practiceType}
                    </p>
                  </div>
                  <Badge variant="secondary">Segera hadir</Badge>
                </li>
              ))}
        </ol>

        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Proyek Mini Akhir Jalur
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {track.miniProject}
          </p>
        </div>
      </Card>
    </section>
  );
}
