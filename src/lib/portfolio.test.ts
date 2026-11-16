import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCompletedTrackSlugs,
  getAdjacentProjects,
  isValidProjectSlug,
  isValidUsername,
  resolveCompletedTrackSkills,
  resolveUniqueSlug,
  slugifyProjectTitle,
  sortProjectsForGallery,
  validateProjectInput,
  type PortfolioProject,
} from './portfolio';
import { TRACKS } from '../data/curriculum';

test('slugifyProjectTitle dan isValidProjectSlug menghasilkan dan memvalidasi slug dengan benar', () => {
  assert.equal(
    slugifyProjectTitle('Analisis Penjualan Toko Ritel 2026!'),
    'analisis-penjualan-toko-ritel-2026'
  );
  assert.equal(isValidProjectSlug('analisis-penjualan-2026'), true);
  assert.equal(isValidProjectSlug('Analisis_Penjualan'), false);
  assert.equal(isValidProjectSlug('slug-dengan--double-?'), false);
  assert.equal(isValidUsername('budi-analis99'), true);
  assert.equal(isValidUsername('Budi_Analis'), false);
});

test('resolveUniqueSlug menambahkan akhiran -2, -3 bila slug sudah dipakai user yang sama', () => {
  const existing = ['dashboard-excel', 'dashboard-excel-2'];
  assert.equal(resolveUniqueSlug('dashboard-excel', existing), 'dashboard-excel-3');
  assert.equal(resolveUniqueSlug('proyek-baru', existing), 'proyek-baru');
  assert.equal(
    resolveUniqueSlug('dashboard-excel', existing, 'dashboard-excel'),
    'dashboard-excel'
  );
});

test('validateProjectInput menegakkan batas karakter judul <= 100, deskripsi <= 200, dan URL valid', () => {
  const base = {
    title: 'Dashboard Penjualan Toko',
    slug: 'dashboard-penjualan-toko',
    description: 'Ringkasan 500 transaksi penjualan dengan PivotTable dan Slicer.',
    caseStudy: '## Latar Belakang & Masalah\nAnalisis penjualan.',
    tags: ['Excel', 'PivotTable'],
    githubUrl: 'https://github.com/user/repo',
    datasetUrl: '',
    trackSlug: 'excel-analisis-data',
    thumbnailColor: '#1d4ed8',
    isPublished: true,
    displayOrder: 1,
  };

  assert.equal(validateProjectInput(base), null);
  assert.ok(validateProjectInput({ ...base, title: 'a'.repeat(101) }));
  assert.ok(validateProjectInput({ ...base, description: 'b'.repeat(201) }));
  assert.ok(validateProjectInput({ ...base, githubUrl: 'not-a-url' }));
});

test('sortProjectsForGallery dan getAdjacentProjects mengurutkan berdasarkan displayOrder lalu navigasi prev/next', () => {
  const makeProj = (id: string, slug: string, order: number, pub = true): PortfolioProject => ({
    id,
    userId: 'u1',
    title: id,
    slug,
    description: 'desc',
    caseStudy: 'body',
    tags: ['Excel'],
    githubUrl: '',
    datasetUrl: '',
    trackSlug: 'excel-analisis-data',
    thumbnailColor: '#1d4ed8',
    isPublished: pub,
    displayOrder: order,
    createdAt: '2026-11-16T00:00:00Z',
    updatedAt: '2026-11-16T00:00:00Z',
  });

  const items = [
    makeProj('B', 'proj-b', 2, true),
    makeProj('Draft', 'proj-draft', 0, false),
    makeProj('A', 'proj-a', 1, true),
    makeProj('C', 'proj-c', 3, true),
  ];

  const sorted = sortProjectsForGallery(items.filter((p) => p.isPublished));
  assert.deepEqual(
    sorted.map((p) => p.slug),
    ['proj-a', 'proj-b', 'proj-c']
  );

  const adj = getAdjacentProjects(items, 'proj-b');
  assert.equal(adj.prev?.slug, 'proj-a');
  assert.equal(adj.next?.slug, 'proj-c');
});

test('computeCompletedTrackSlugs dan resolveCompletedTrackSkills mendeteksi track yang 100% selesai', () => {
  const partial = computeCompletedTrackSlugs(TRACKS, ['excel-01', 'excel-02']);
  assert.deepEqual(partial, []);

  const done = computeCompletedTrackSlugs(TRACKS, [
    'excel-01',
    'excel-02',
    'excel-03',
    'excel-04',
    'excel-05',
  ]);
  assert.deepEqual(done, ['excel-analisis-data']);

  const skills = resolveCompletedTrackSkills(TRACKS, done);
  assert.equal(skills.length, 1);
  assert.equal(skills[0]?.label, 'Excel');
});
