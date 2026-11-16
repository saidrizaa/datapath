import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createNotesService,
  extractNotePreviewLines,
  filterNotesByQuery,
  type NotesStorageAdapter,
} from './notesService';

function createMemoryNotesAdapter(): NotesStorageAdapter {
  let raw: string | null = null;
  return {
    read: () => raw,
    write: (next: string) => {
      raw = next;
    },
  };
}

test('notesService menyimpan, membaca, memperbarui, dan menghapus catatan dengan format lessonId standar', () => {
  const service = createNotesService(createMemoryNotesAdapter());
  service.saveLocalNote('excel-1', '# Ringkasan\nBaris 2\nBaris 3\nBaris 4');

  const note = service.getNote('excel-01');
  assert.equal(note?.lessonId, 'excel-01');
  assert.ok(note?.content.includes('Baris 4'));

  assert.equal(service.listNotes().length, 1);

  service.deleteLocalNote('excel-01');
  assert.equal(service.getNote('excel-01'), null);
  assert.equal(service.listNotes().length, 0);
});

test('extractNotePreviewLines mengambil maksimal 3 baris pertama', () => {
  const preview = extractNotePreviewLines('Baris satu\nBaris dua\nBaris tiga\nBaris empat', 3);
  assert.equal(preview, 'Baris satu\nBaris dua\nBaris tiga\n...');
});

test('filterNotesByQuery menyaring catatan berdasarkan teks isi maupun judul pelajaran', () => {
  const notes = [
    { lessonId: 'excel-01', content: 'Belajar Tidy Data dan Ctrl+T', updatedAt: '2026-11-16T10:00:00Z' },
    { lessonId: 'excel-02', content: 'Rumus SUMIFS dan referensi absolut $P$1', updatedAt: '2026-11-16T11:00:00Z' },
  ];
  const resolver = (id: string) =>
    id === 'excel-01' ? 'Mengenal Excel dan Data yang Rapi' : 'Rumus dan Fungsi Dasar';

  const byContent = filterNotesByQuery(notes, '$P$1', resolver);
  assert.equal(byContent.length, 1);
  assert.equal(byContent[0]?.lessonId, 'excel-02');

  const byTitle = filterNotesByQuery(notes, 'Tidy Data', resolver);
  assert.equal(byTitle.length, 1);
  assert.equal(byTitle[0]?.lessonId, 'excel-01');
});
