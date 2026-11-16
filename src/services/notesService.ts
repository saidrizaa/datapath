import { formatSupabaseError, isSupabaseConfigured, supabase } from '../lib/supabase';
import { normalizeLessonId } from '../lib/progressMigration';

export interface LessonNote {
  lessonId: string;
  content: string;
  updatedAt: string;
  createdAt?: string;
}

export interface NotesStorageAdapter {
  read(): string | null;
  write(raw: string): void;
}

const NOTES_STORAGE_KEY = 'datapath-notes-v1';

const browserNotesAdapter: NotesStorageAdapter = {
  read() {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(NOTES_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  write(raw: string) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(NOTES_STORAGE_KEY, raw);
    } catch {
      // Abaikan bila localStorage diblokir browser
    }
  },
};

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

export function extractNotePreviewLines(content: string, maxLines = 3): string {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line, idx, arr) => line.trim().length > 0 || (idx > 0 && idx < arr.length - 1));
  if (lines.length === 0) return '(Catatan masih kosong)';
  const sliced = lines.slice(0, maxLines).join('\n');
  return lines.length > maxLines ? `${sliced}\n...` : sliced;
}

export function filterNotesByQuery(notes: LessonNote[], query: string, titleResolver: (lessonId: string) => string): LessonNote[] {
  const q = query.trim().toLowerCase();
  const sorted = [...notes].sort(
    (a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0)
  );
  if (!q) return sorted;
  return sorted.filter((note) => {
    const lessonTitle = titleResolver(note.lessonId).toLowerCase();
    return (
      note.content.toLowerCase().includes(q) ||
      note.lessonId.toLowerCase().includes(q) ||
      lessonTitle.includes(q)
    );
  });
}

export function createNotesService(adapter: NotesStorageAdapter = browserNotesAdapter) {
  function readAllMap(): Record<string, LessonNote> {
    const raw = adapter.read();
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw) as Record<string, Partial<LessonNote>>;
      if (!parsed || typeof parsed !== 'object') return {};
      const result: Record<string, LessonNote> = {};
      for (const [rawId, val] of Object.entries(parsed)) {
        if (!val || typeof val.content !== 'string') continue;
        const lessonId = normalizeLessonId(val.lessonId ?? rawId);
        result[lessonId] = {
          lessonId,
          content: val.content,
          updatedAt: typeof val.updatedAt === 'string' ? val.updatedAt : new Date().toISOString(),
          createdAt: typeof val.createdAt === 'string' ? val.createdAt : undefined,
        };
      }
      return result;
    } catch {
      return {};
    }
  }

  function writeAllMap(map: Record<string, LessonNote>) {
    adapter.write(JSON.stringify(map));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('datapath-notes-changed'));
    }
  }

  function listNotes(): LessonNote[] {
    return Object.values(readAllMap()).sort(
      (a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0)
    );
  }

  function getNote(lessonId: string): LessonNote | null {
    const id = normalizeLessonId(lessonId);
    return readAllMap()[id] ?? null;
  }

  function saveLocalNote(lessonId: string, content: string): LessonNote {
    const id = normalizeLessonId(lessonId);
    const map = readAllMap();
    const nowIso = new Date().toISOString();
    const next: LessonNote = {
      lessonId: id,
      content,
      createdAt: map[id]?.createdAt ?? nowIso,
      updatedAt: nowIso,
    };
    map[id] = next;
    writeAllMap(map);
    return next;
  }

  function deleteLocalNote(lessonId: string): void {
    const id = normalizeLessonId(lessonId);
    const map = readAllMap();
    if (id in map) {
      delete map[id];
      writeAllMap(map);
    }
  }

  return {
    listNotes,
    getNote,
    saveLocalNote,
    deleteLocalNote,
  };
}

export const notesService = createNotesService();

export async function fetchAllNotes(userId?: string | null): Promise<LessonNote[]> {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return notesService.listNotes();
  }

  const { data, error } = await supabase
    .from('notes')
    .select('lesson_id, content, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    if (isMissingRelationError(error)) {
      return notesService.listNotes();
    }
    throw new Error(formatSupabaseError(error));
  }

  const remoteMap = new Map<string, LessonNote>();
  for (const row of data ?? []) {
    const lessonId = normalizeLessonId(String(row.lesson_id));
    remoteMap.set(lessonId, {
      lessonId,
      content: String(row.content ?? ''),
      createdAt: row.created_at ? String(row.created_at) : undefined,
      updatedAt: String(row.updated_at ?? new Date().toISOString()),
    });
  }

  // Sertakan catatan lokal yang belum tersinkron agar tidak hilang
  for (const localNote of notesService.listNotes()) {
    if (!remoteMap.has(localNote.lessonId) && localNote.content.trim()) {
      remoteMap.set(localNote.lessonId, localNote);
    }
  }

  return Array.from(remoteMap.values()).sort(
    (a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0)
  );
}

export async function fetchLessonNote(
  lessonId: string,
  userId?: string | null
): Promise<LessonNote | null> {
  const canonicalId = normalizeLessonId(lessonId);
  if (!userId || !isSupabaseConfigured || !supabase) {
    return notesService.getNote(canonicalId);
  }

  const { data, error } = await supabase
    .from('notes')
    .select('lesson_id, content, created_at, updated_at')
    .eq('user_id', userId)
    .eq('lesson_id', canonicalId)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) {
      return notesService.getNote(canonicalId);
    }
    throw new Error(formatSupabaseError(error));
  }

  if (!data) {
    return notesService.getNote(canonicalId);
  }

  return {
    lessonId: canonicalId,
    content: String(data.content ?? ''),
    createdAt: data.created_at ? String(data.created_at) : undefined,
    updatedAt: String(data.updated_at ?? new Date().toISOString()),
  };
}

export async function saveLessonNote(
  lessonId: string,
  content: string,
  userId?: string | null
): Promise<{ note: LessonNote; mode: 'supabase' | 'local' }> {
  const canonicalId = normalizeLessonId(lessonId);
  const savedLocal = notesService.saveLocalNote(canonicalId, content);

  if (!userId || !isSupabaseConfigured || !supabase) {
    return { note: savedLocal, mode: 'local' };
  }

  const { data, error } = await supabase
    .from('notes')
    .upsert(
      {
        user_id: userId,
        lesson_id: canonicalId,
        content,
        updated_at: savedLocal.updatedAt,
      },
      { onConflict: 'user_id,lesson_id' }
    )
    .select('lesson_id, content, created_at, updated_at')
    .single();

  if (error) {
    if (isMissingRelationError(error)) {
      return { note: savedLocal, mode: 'local' };
    }
    throw new Error(formatSupabaseError(error));
  }

  return {
    note: {
      lessonId: canonicalId,
      content: String(data.content ?? content),
      createdAt: data.created_at ? String(data.created_at) : undefined,
      updatedAt: String(data.updated_at ?? savedLocal.updatedAt),
    },
    mode: 'supabase',
  };
}

export async function deleteLessonNote(
  lessonId: string,
  userId?: string | null
): Promise<void> {
  const canonicalId = normalizeLessonId(lessonId);
  notesService.deleteLocalNote(canonicalId);

  if (!userId || !isSupabaseConfigured || !supabase) {
    return;
  }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('user_id', userId)
    .eq('lesson_id', canonicalId);

  if (error && !isMissingRelationError(error)) {
    throw new Error(formatSupabaseError(error));
  }
}
