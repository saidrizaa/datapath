import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Cloud,
  NotebookPen,
  Search,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EXCEL_LESSONS } from '../data/excelLessons';
import {
  deleteLessonNote,
  extractNotePreviewLines,
  fetchAllNotes,
  filterNotesByQuery,
  type LessonNote,
} from '../services/notesService';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { usePageMeta } from '../lib/seo';

function resolveLessonInfo(lessonId: string) {
  const found = EXCEL_LESSONS.find((l) => l.id === lessonId);
  return found
    ? {
        title: `0${found.order}. ${found.title}`,
        url: `/belajar/excel/${found.slug}#catatan-pribadi`,
      }
    : {
        title: lessonId.toUpperCase(),
        url: '/roadmap',
      };
}

function formatDateTimeId(iso: string): string {
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

export function NotesPage() {
  usePageMeta({
    title: 'Catatan Belajar Pribadi | DataPath',
    description: 'Kelola dan cari catatan ringkasan belajar Markdown Anda per pelajaran di DataPath.',
    noIndex: true,
  });

  const { user, storageMode } = useAuth();
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadNotes = () => {
    setLoading(true);
    setError(null);
    fetchAllNotes(user?.id)
      .then((list) => {
        setNotes(list);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Gagal memuat daftar catatan.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadNotes();
  }, [user?.id]);

  const filteredNotes = useMemo(
    () =>
      filterNotesByQuery(notes, searchQuery, (id) => resolveLessonInfo(id).title).filter(
        (n) => n.content.trim().length > 0
      ),
    [notes, searchQuery]
  );

  const handleConfirmDelete = async (lessonId: string) => {
    setDeletingId(lessonId);
    setError(null);
    try {
      await deleteLessonNote(lessonId, user?.id);
      setNotes((prev) => prev.filter((item) => item.lessonId !== lessonId));
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus catatan.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">
              <Cloud className="mr-1 h-3 w-3" aria-hidden="true" />
              {storageMode === 'supabase' ? 'Tersinkron ke Supabase' : 'Mode Browser Lokal'}
            </Badge>
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Catatan Pribadi
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Kumpulan ringkasan belajar per pelajaran. Cari catatan atau buka kembali materi untuk mengedit.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400"
        >
          ← Kembali ke Dashboard
        </Link>
      </div>

      {/* Pencarian teks sisi klien */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari isi catatan atau judul pelajaran..."
            aria-label="Cari catatan pribadi"
            className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <p className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
          Menampilkan {filteredNotes.length} catatan tersimpan
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2].map((n) => (
            <Card key={n} className="h-44 animate-pulse bg-slate-100/70 p-6 dark:bg-slate-900/50" />
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <Card className="mt-8 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            <NotebookPen className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            {searchQuery.trim()
              ? 'Tidak ada catatan yang cocok dengan pencarian'
              : 'Belum ada catatan pelajaran'}
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
            {searchQuery.trim()
              ? 'Coba gunakan kata kunci lain atau hapus filter pencarian.'
              : 'Buka salah satu pelajaran lalu buka bagian "Catatan Pribadi Pelajaran Ini" di bawah materi untuk menulis ringkasan.'}
          </p>
          <div className="mt-5">
            <Link
              to="/belajar/excel/mengenal-excel-dan-data-rapi#catatan-pribadi"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 dark:bg-blue-600"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span>Tulis Catatan di Pelajaran 1</span>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredNotes.map((note) => {
            const info = resolveLessonInfo(note.lessonId);
            const preview = extractNotePreviewLines(note.content, 3);
            const isConfirming = confirmDeleteId === note.lessonId;

            return (
              <Card key={note.lessonId} className="flex flex-col justify-between p-5">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to={info.url}
                      className="font-display text-base font-bold text-slate-900 hover:text-blue-700 dark:text-slate-100 dark:hover:text-blue-400"
                    >
                      {info.title}
                    </Link>
                    <span className="shrink-0 font-mono text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
                      {formatDateTimeId(note.updatedAt)}
                    </span>
                  </div>

                  <pre className="mt-3 whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                    {preview}
                  </pre>
                </div>

                <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
                  {isConfirming ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
                      <span className="font-medium">Yakin hapus catatan ini?</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={deletingId === note.lessonId}
                        >
                          Batal
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void handleConfirmDelete(note.lessonId)}
                          disabled={deletingId === note.lessonId}
                          className="bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500"
                        >
                          {deletingId === note.lessonId ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        to={info.url}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
                      >
                        <span>Buka & Edit Catatan</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(note.lessonId)}
                        aria-label={`Hapus catatan ${info.title}`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
