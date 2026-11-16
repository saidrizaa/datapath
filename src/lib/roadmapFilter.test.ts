import test from 'node:test';
import assert from 'node:assert/strict';
import { TRACKS } from '../data/curriculum';
import { filterTracks, findTrackBySlug, getCurriculumStats } from './roadmapFilter';

test('getCurriculumStats menghitung total 8 track dan jam belajar dengan akurat', () => {
  const stats = getCurriculumStats(TRACKS);
  assert.equal(stats.totalTracks, 8);
  assert.equal(stats.beginnerCount, 3);
  assert.equal(stats.intermediateCount, 3);
  assert.equal(stats.advancedCount, 2);
  assert.equal(stats.totalHours, 84);
  assert.equal(stats.totalModules, 31);
});

test('filterTracks menyaring berdasarkan level dengan benar', () => {
  assert.equal(filterTracks(TRACKS, 'Semua').length, 8);
  assert.equal(filterTracks(TRACKS, 'Pemula').length, 3);
  assert.equal(filterTracks(TRACKS, 'Menengah').length, 3);
  assert.equal(filterTracks(TRACKS, 'Lanjut').length, 2);
});

test('filterTracks mendukung pencarian topik lintas track', () => {
  const results = filterTracks(TRACKS, 'Semua', 'PivotTable');
  assert.equal(results.length, 1);
  assert.equal(results[0].slug, 'excel-analisis-data');

  const empty = filterTracks(TRACKS, 'Lanjut', 'PivotTable');
  assert.equal(empty.length, 0);
});

test('Track 1 Excel memiliki minimal 5 pelajaran awal dan dapat ditemukan lewat slug', () => {
  const excelTrack = findTrackBySlug(TRACKS, 'excel-analisis-data');
  assert.ok(excelTrack);
  assert.equal(excelTrack.starterLessons.length, 5);
});
