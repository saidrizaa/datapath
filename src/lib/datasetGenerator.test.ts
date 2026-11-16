import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  CSV_HEADERS,
  generateCleanSalesRows,
  generateDirtySalesRows,
  serializeSalesCsv,
} from './datasetGenerator';

test('generateCleanSalesRows menghasilkan tepat 500 baris dengan ID unik', () => {
  const rows = generateCleanSalesRows(500);
  assert.equal(rows.length, 500);

  const uniqueIds = new Set(rows.map((r) => r.idTransaksi));
  assert.equal(uniqueIds.size, 500);
  assert.ok(rows.every((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.tanggal)));
  assert.ok(rows.every((r) => r.jumlah >= 1 && r.hargaSatuan > 0));
});

test('penjualan-toko.csv memuat seluruh cabang, Rina Wijaya, kategori, diskon 0.15, dan jumlah >= 9', () => {
  const csvPath = path.resolve(process.cwd(), 'public/datasets/penjualan-toko.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8').trim();
  const lines = csvContent.split('\n');
  assert.equal(lines.length, 501);
  assert.equal(lines[0], CSV_HEADERS.join(','));

  const rows = lines.slice(1).map((line) => {
    const [idTransaksi, tanggal, cabang, kategori, produk, jumlah, hargaSatuan, diskon, namaSales] =
      line.split(',');
    return {
      idTransaksi,
      tanggal,
      cabang,
      kategori,
      produk,
      jumlah: Number(jumlah),
      hargaSatuan: Number(hargaSatuan),
      diskon: Number(diskon),
      namaSales,
    };
  });

  const branches = new Set(rows.map((r) => r.cabang));
  for (const requiredBranch of ['Jakarta Selatan', 'Medan', 'Surabaya']) {
    assert.ok(branches.has(requiredBranch), `Cabang ${requiredBranch} harus ada`);
  }

  const categories = new Set(rows.map((r) => r.kategori));
  for (const requiredCategory of [
    'Elektronik',
    'Aksesoris Komputer',
    'Perlengkapan Kantor',
    'Perabot Kerja',
  ]) {
    assert.ok(categories.has(requiredCategory), `Kategori ${requiredCategory} harus ada`);
  }

  assert.ok(
    rows.some((r) => r.cabang === 'Jakarta Selatan' && r.namaSales === 'Rina Wijaya'),
    'Harus ada transaksi Rina Wijaya di Jakarta Selatan'
  );
  assert.ok(
    rows.some((r) => r.diskon >= 0.15),
    'Nilai Diskon harus mencapai 0.15'
  );
  assert.ok(
    rows.some((r) => r.jumlah >= 9),
    'Nilai Jumlah harus mencapai minimal 9'
  );
});

test('generateDirtySalesRows menyertakan duplikat, spasi berlebih, dan variasi format tanggal', () => {
  const clean = generateCleanSalesRows(500);
  const dirty = generateDirtySalesRows(clean);

  assert.ok(dirty.length > 500);
  const uniqueIds = new Set(dirty.map((r) => r.idTransaksi));
  assert.equal(uniqueIds.size, 500);

  const hasExtraSpaces = dirty.some(
    (r) => r.cabang !== r.cabang.trim() || r.namaSales !== r.namaSales.trim()
  );
  const hasSlashDates = dirty.some((r) => r.tanggal.includes('/'));

  assert.equal(hasExtraSpaces, true);
  assert.equal(hasSlashDates, true);
});

test('serializeSalesCsv menyertakan seluruh 9 kolom wajib', () => {
  const rows = generateCleanSalesRows(5);
  const csv = serializeSalesCsv(rows);
  const lines = csv.trim().split('\n');
  assert.equal(lines.length, 6);
  assert.equal(lines[0], CSV_HEADERS.join(','));
});
