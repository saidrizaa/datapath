import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  FileEdit,
  Loader2,
  NotebookPen,
  Save,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchLessonNote, saveLessonNote } from '../../services/notesService';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { SimpleMarkdown } from '../common/SimpleMarkdown';

export function LessonNotesEditor({
  lessonId,
  lessonTitle,
}: {
  lessonId: string;
  lessonTitle: string;
}) {
  const textareaId = useId();
  const { user } = useAuth();

  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [content, setContent] = useState('');
  const [lastSavedContent, setLastSavedContent] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveMode, setSaveMode] = useState<'supabase' | 'local'>(user ? 'supabase' : 'local');
  const [saving, setSaving] = useState(false);
  const [loadingNote, setLoadingNote] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contentRef = useRef(content);
  contentRef.current = content;
  const lastSavedRef = useRef(lastSavedContent);
  lastSavedRef.current = lastSavedContent;

  useEffect(() => {
    let active = true;
    setLoadingNote(true);
    setError(null);

    fetchLessonNote(lessonId, user?.id)
      .then((note) => {
        if (!active) return;
        const text = note?.content ?? '';
        setContent(text);
        setLastSavedContent(text);
        setSavedAt(note?.updatedAt ?? null);
        setLoadingNote(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat catatan.');
        setLoadingNote(false);
      });

    return () => {
      active = false;
    };
  }, [lessonId, user?.id]);

  const handleSave = async (targetContent = contentRef.current) => {
    setSaving(true);
    setError(null);
    try {
      const res = await saveLessonNote(lessonId, targetContent, user?.id);
      setLastSavedContent(targetContent);
      setSavedAt(res.note.updatedAt);
      setSaveMode(res.mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan catatan.');
    } finally {
      setSaving(false);
    }
  };

  // Autosave setiap 30 detik jika ada perubahan yang belum disimpan
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (contentRef.current !== lastSavedRef.current) {
        void handleSave(contentRef.current);
      }
    }, 30000);
    return () => window.clearInterval(interval);
  }, [lessonId, user?.id]);

  const isDirty = content !== lastSavedContent;
  const formattedTime = savedAt
    ? new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(savedAt))
    : null;

  return (
    <section id="catatan-pribadi" className="mt-10 scroll-mt-24">
      <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between gap-4 bg-slate-50/80 px-5 py-4 text-left transition-colors hover:bg-slate-100/80 dark:bg-slate-900/70 dark:hover:bg-slate-900 cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300">
              <NotebookPen className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-50">
                Catatan Pribadi Pelajaran Ini
              </h2>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {content.trim()
                  ? `Catatan tersimpan (${content.trim().split(/\s+/).length} kata) · Klik untuk ${expanded ? 'melipat' : 'membuka'}`
                  : `Tulis ringkasan pribadi Anda tentang ${lessonTitle} (autosave tiap 30 detik)`}
              </p>
            </div>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
            <span>{expanded ? 'Lipat' : 'Buka Editor'}</span>
            {expanded ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </span>
        </button>

        {expanded && (
          <div className="space-y-4 border-t border-slate-200 p-5 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setMode('write')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    mode === 'write'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <FileEdit className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Tulis (Markdown)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('preview')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    mode === 'preview'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Pratinjau</span>
                </button>
              </div>

              <Link
                to="/catatan"
                className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
              >
                Lihat Semua Catatan →
              </Link>
            </div>

            {loadingNote ? (
              <div className="flex items-center gap-2 py-6 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Memuat catatan...</span>
              </div>
            ) : mode === 'write' ? (
              <div>
                <label htmlFor={textareaId} className="sr-only">
                  Editor catatan markdown untuk {lessonTitle}
                </label>
                <textarea
                  id={textareaId}
                  rows={7}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Contoh format Markdown:\n# Poin Penting\n- Gunakan **Ctrl + T** untuk membuat Excel Table\n- Rumus contoh: \`=ROUND(F2*G2, 0)\``}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3.5 font-mono text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Mendukung Markdown dasar: <code className="font-mono"># Judul</code>,{' '}
                  <code className="font-mono">**tebal**</code>,{' '}
                  <code className="font-mono">*miring*</code>,{' '}
                  <code className="font-mono">`kode`</code>, dan daftar <code className="font-mono">- item</code>.
                </p>
              </div>
            ) : (
              <div className="min-h-[168px] rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <SimpleMarkdown
                  content={content}
                  emptyText="Belum ada catatan yang ditulis untuk pelajaran ini."
                />
              </div>
            )}

            {error && (
              <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    <span>Menyimpan catatan...</span>
                  </>
                ) : isDirty ? (
                  <span className="text-amber-700 dark:text-amber-400">
                    Ada perubahan belum disimpan (autosave tiap 30 detik)
                  </span>
                ) : formattedTime ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Tersimpan ({formattedTime}) · {saveMode === 'supabase' ? 'Supabase' : 'Browser Lokal'}
                  </span>
                ) : (
                  <span>Siap menulis catatan</span>
                )}
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => void handleSave()}
                disabled={saving || loadingNote}
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Simpan Catatan</span>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}
