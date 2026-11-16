import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
} from 'lucide-react';
import {
  EXCEL_LESSONS,
  LESSON_TOC_ITEMS,
  findExcelLessonBySlug,
} from '../data/excelLessons';
import { useProgress } from '../hooks/useProgress';
import { usePageMeta } from '../lib/seo';
import { mdxComponents } from '../components/lesson/MdxComponents';
import { DatasetDownloadBox } from '../components/lesson/DatasetDownloadBox';
import { LessonNotesEditor } from '../components/lesson/LessonNotesEditor';
import { LessonQuiz } from '../components/lesson/LessonQuiz';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Progress } from '../components/ui/progress';

export function LessonPage() {
  const { lessonSlug } = useParams<{ lessonSlug: string }>();
  const lesson = findExcelLessonBySlug(lessonSlug);
  const {
    progress,
    storageMode,
    syncError,
    toggleComplete,
    saveQuiz,
    isCompleted,
    getTrackStats,
  } = useProgress();

  usePageMeta({
    title: lesson
      ? `${lesson.title} — Track Excel | DataPath`
      : 'Pelajaran Tidak Ditemukan | DataPath',
    description: lesson
      ? lesson.summary
      : 'Materi interaktif Track 1: Excel untuk Analisis Data di DataPath.',
    ogType: 'article',
  });

  if (!lesson) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            Pelajaran tidak ditemukan
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Silakan pilih pelajaran yang tersedia dari Track 1: Excel untuk Analisis Data.
          </p>
          <div className="mt-6">
            <Link
              to="/roadmap/excel-analisis-data"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 dark:bg-blue-600"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Kembali ke Daftar Pelajaran Excel</span>
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  const LessonContent = lesson.Component;
  const lessonIndex = EXCEL_LESSONS.findIndex((item) => item.slug === lesson.slug);
  const prevLesson = lessonIndex > 0 ? EXCEL_LESSONS[lessonIndex - 1] : null;
  const nextLesson =
    lessonIndex < EXCEL_LESSONS.length - 1 ? EXCEL_LESSONS[lessonIndex + 1] : null;

  const completed = isCompleted(lesson.id);
  const trackStats = getTrackStats(EXCEL_LESSONS.map((l) => l.id));
  const savedQuizAttempt = progress.quizAttempts[lesson.id];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      {/* Breadcrumb Navigasi */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link to="/roadmap" className="hover:text-blue-700 dark:hover:text-blue-400">
          Roadmap
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          to="/roadmap/excel-analisis-data"
          className="hover:text-blue-700 dark:hover:text-blue-400"
        >
          Track 01: Excel
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-slate-800 dark:text-slate-200">
          Pelajaran 0{lesson.order}
        </span>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
        {/* Kolom Utama Artikel Pelajaran MDX */}
        <article className="min-w-0 lg:col-span-8">
          <header className="border-b border-slate-200 pb-6 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs font-medium text-blue-700 tabular-nums dark:text-blue-400">
                Pelajaran 0{lesson.order} · {lesson.moduleTitle}
              </span>
              <Badge variant={completed ? 'success' : 'secondary'}>
                {completed ? 'Selesai' : 'Belum Selesai'}
              </Badge>
            </div>

            <h1
              className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
              style={{ textWrap: 'balance' }}
            >
              {lesson.title}
            </h1>

            <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              {lesson.summary}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500 tabular-nums dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Estimasi ± {lesson.durationMinutes} menit
              </span>
              <span>Track 1: Excel untuk Analisis Data</span>
            </div>
          </header>

          {/* Unduh Dataset CSV Praktik */}
          <DatasetDownloadBox hasDirtyDataset={lesson.hasDirtyDataset} />

          {/* Konten MDX Pelajaran */}
          <div className="mt-6">
            <LessonContent components={mdxComponents} />
          </div>

          {/* Catatan Pribadi Pelajaran (Collapsible Markdown + Autosave 30s) */}
          <LessonNotesEditor lessonId={lesson.id} lessonTitle={lesson.title} />

          {/* Kuis Interaktif 5 Soal */}
          <LessonQuiz
            lessonId={lesson.id}
            questions={lesson.quiz}
            savedAttempt={savedQuizAttempt}
            onSaveAttempt={saveQuiz}
          />

          {/* Aksi Tandai Selesai & Navigasi Pelajaran */}
          <div className="mt-10 space-y-6 border-t border-slate-200 pt-8 dark:border-slate-800">
            {syncError && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
              >
                {syncError}
              </div>
            )}
            <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                  {completed
                    ? 'Pelajaran ini sudah ditandai selesai'
                    : 'Sudah menyelesaikan materi dan latihan di atas?'}
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {storageMode === 'supabase'
                    ? `Progres tersinkron ke akun Supabase Anda (${trackStats.completedCount} dari ${trackStats.totalCount} pelajaran Track 1 selesai).`
                    : `Progres tersimpan di browser Anda (${trackStats.completedCount} dari ${trackStats.totalCount} pelajaran Track 1 selesai).`}
                </p>
              </div>

              <Button
                variant={completed ? 'outline' : 'default'}
                onClick={() => toggleComplete(lesson.id)}
                aria-pressed={completed}
              >
                {completed ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    <span>Selesai (Batalkan)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>Tandai Selesai</span>
                  </>
                )}
              </Button>
            </Card>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {prevLesson ? (
                <Link
                  to={`/belajar/excel/${prevLesson.slug}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">Sebelumnya: {prevLesson.title}</span>
                </Link>
              ) : (
                <span />
              )}

              {nextLesson ? (
                <Link
                  to={`/belajar/excel/${nextLesson.slug}`}
                  className="inline-flex min-h-11 items-center justify-end gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  <span className="truncate">Berikutnya: {nextLesson.title}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
              ) : (
                <Link
                  to="/roadmap"
                  className="inline-flex min-h-11 items-center justify-end gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  <span>Kembali ke Roadmap Lengkap</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        </article>

        {/* Sidebar Kanan: Progres, Daftar Isi Samping, & Navigator Pelajaran */}
        <aside className="space-y-6 lg:col-span-4 lg:sticky lg:top-24">
          {/* Progres Track 1 */}
          <Card className="p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
              <span>Progres Track 1: Excel</span>
              <span className="font-mono tabular-nums">{trackStats.percentage}%</span>
            </div>
            <Progress
              value={trackStats.percentage}
              label="Progres Track 1 Excel"
              className="mt-2.5"
            />
            <p className="mt-2 text-xs text-slate-500 tabular-nums dark:text-slate-400">
              {trackStats.completedCount} dari {trackStats.totalCount} pelajaran selesai
            </p>
          </Card>

          {/* Daftar Isi Samping */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Daftar Isi Pelajaran
            </h2>
            <nav aria-label="Daftar isi pelajaran" className="mt-3 flex flex-col gap-1">
              {LESSON_TOC_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="rounded-md px-2.5 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </Card>

          {/* Navigator 5 Pelajaran Track 1 */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Semua Pelajaran Track 1
            </h2>
            <ol className="mt-3 space-y-1.5">
              {EXCEL_LESSONS.map((item) => {
                const isCurrent = item.slug === lesson.slug;
                const itemDone = isCompleted(item.id);

                return (
                  <li key={item.id}>
                    <Link
                      to={`/belajar/excel/${item.slug}`}
                      aria-current={isCurrent ? 'page' : undefined}
                      className={`flex items-start gap-2.5 rounded-lg p-2 text-xs transition-colors ${
                        isCurrent
                          ? 'bg-blue-50 font-semibold text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {itemDone ? (
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                          aria-label="Selesai"
                        />
                      ) : (
                        <Circle
                          className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                          aria-hidden="true"
                        />
                      )}
                      <span className="leading-snug">
                        0{item.order}. {item.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </Card>
        </aside>
      </div>
    </div>
  );
}
