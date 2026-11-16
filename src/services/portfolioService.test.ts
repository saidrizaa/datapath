import test from 'node:test';
import assert from 'node:assert/strict';
import { createProjectsService, type ProjectsStorageAdapter } from './portfolioService';
import type { ProjectFormInput } from '../lib/portfolio';

function createMemoryProjectsAdapter(): ProjectsStorageAdapter {
  let raw: string | null = null;
  return {
    read: () => raw,
    write: (next: string) => {
      raw = next;
    },
  };
}

const sampleInput: ProjectFormInput = {
  title: 'Dashboard Penjualan Toko',
  slug: 'dashboard-penjualan-toko',
  description: 'Ringkasan performa 5 cabang dan profitabilitas kategori.',
  caseStudy: '## Latar Belakang & Masalah\nMenganalisis 500 baris penjualan toko.',
  tags: ['Excel', 'PivotTable'],
  githubUrl: 'https://github.com/contoh/dashboard-excel',
  datasetUrl: '',
  trackSlug: 'excel-analisis-data',
  thumbnailColor: '#1d4ed8',
  isPublished: false,
  displayOrder: 1,
};

test('createProjectsService menyimpan proyek, mencegah duplikat slug (-2), publish toggle, dan hapus', () => {
  const service = createProjectsService(createMemoryProjectsAdapter());

  const first = service.saveProject('u1', sampleInput);
  assert.equal(first.slug, 'dashboard-penjualan-toko');
  assert.equal(first.isPublished, false);

  const second = service.saveProject('u1', sampleInput);
  assert.equal(second.slug, 'dashboard-penjualan-toko-2');

  const published = service.togglePublish('u1', first.id, true);
  assert.equal(published?.isPublished, true);

  const list = service.listUserProjects('u1');
  assert.equal(list.length, 2);

  service.deleteProject('u1', second.id);
  assert.equal(service.listUserProjects('u1').length, 1);
});
