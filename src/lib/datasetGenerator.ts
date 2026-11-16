// Generator dataset sintetis "Penjualan Toko" (±500 baris) versi bersih dan kotor

export const CSV_HEADERS = [
  'ID Transaksi',
  'Tanggal',
  'Cabang',
  'Kategori',
  'Produk',
  'Jumlah',
  'Harga Satuan',
  'Diskon',
  'Nama Sales',
] as const;

interface ProductCatalogItem {
  kategori: string;
  produk: string;
  harga: number;
}

const BRANCHES = ['Jakarta Selatan', 'Bandung', 'Surabaya', 'Yogyakarta', 'Medan'] as const;

const SALES_REPS = [
  'Rina Wijaya',
  'Bagus Santoso',
  'Dina Permata',
  'Fajar Nugroho',
  'Sari Lestari',
  'Hendra Kusuma',
  'Tania Putri',
  'Arif Rahman',
] as const;

const CATALOG: ProductCatalogItem[] = [
  { kategori: 'Elektronik', produk: 'Monitor IPS 24 Inci', harga: 1850000 },
  { kategori: 'Elektronik', produk: 'Printer Inkjet WiFi', harga: 1450000 },
  { kategori: 'Elektronik', produk: 'Webcam Full HD 1080p', harga: 420000 },
  { kategori: 'Aksesoris Komputer', produk: 'Mouse Wireless Ergonomis', harga: 185000 },
  { kategori: 'Aksesoris Komputer', produk: 'Keyboard Mekanikal TKL', harga: 540000 },
  { kategori: 'Aksesoris Komputer', produk: 'USB-C Hub 7-in-1', harga: 295000 },
  { kategori: 'Perlengkapan Kantor', produk: 'Kertas A4 80gsm (1 Rim)', harga: 55000 },
  { kategori: 'Perlengkapan Kantor', produk: 'Tinta Printer Hitam', harga: 115000 },
  { kategori: 'Perlengkapan Kantor', produk: 'Binder Clip & Organizer Set', harga: 48000 },
  { kategori: 'Perabot Kerja', produk: 'Kursi Kerja Jaring', harga: 1250000 },
  { kategori: 'Perabot Kerja', produk: 'Meja Lipat Minimalis 120cm', harga: 780000 },
  { kategori: 'Perabot Kerja', produk: 'Penyangga Laptop Aluminium', harga: 210000 },
];

const DISCOUNTS = [0, 0, 0, 0.05, 0.1, 0.15] as const;

// PRNG deterministik Mulberry32 agar dataset selalu konsisten
function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

export interface SalesRow {
  idTransaksi: string;
  tanggal: string;
  cabang: string;
  kategori: string;
  produk: string;
  jumlah: number;
  hargaSatuan: number;
  diskon: number;
  namaSales: string;
}

export function generateCleanSalesRows(rowCount = 500, seed = 202601): SalesRow[] {
  const rand = createRng(seed);
  const startDate = new Date(Date.UTC(2026, 0, 1));
  const rows: SalesRow[] = [];

  for (let i = 1; i <= rowCount; i++) {
    const dayOffset = Math.floor(rand() * 180); // Jan - Jun 2026
    const dt = new Date(startDate.getTime() + dayOffset * 86400000);
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');

    const item = CATALOG[Math.floor(rand() * CATALOG.length)];
    const cabang = BRANCHES[Math.floor(rand() * BRANCHES.length)];
    const namaSales = SALES_REPS[Math.floor(rand() * SALES_REPS.length)];
    const jumlah = 1 + Math.floor(rand() * 10);
    const diskon = DISCOUNTS[Math.floor(rand() * DISCOUNTS.length)];

    rows.push({
      idTransaksi: `TRX-2026-${String(i).padStart(4, '0')}`,
      tanggal: `${yyyy}-${mm}-${dd}`,
      cabang,
      kategori: item.kategori,
      produk: item.produk,
      jumlah,
      hargaSatuan: item.harga,
      diskon,
      namaSales,
    });
  }

  return rows;
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// Buat versi "kotor" untuk Pelajaran 4: duplikat, spasi berlebih, kapitalisasi acak, dan format tanggal tidak seragam
export function generateDirtySalesRows(cleanRows: SalesRow[], seed = 202604): SalesRow[] {
  const rand = createRng(seed);
  const dirtyRows: SalesRow[] = [];

  cleanRows.forEach((row, index) => {
    const copy: SalesRow = { ...row };

    // Format tanggal tidak konsisten pada ~35% baris
    if (index % 3 === 0) {
      const [yyyy, mm, dd] = copy.tanggal.split('-');
      const monthIdx = Number(mm) - 1;
      if (index % 6 === 0) {
        copy.tanggal = `${dd}/${mm}/${yyyy}`;
      } else {
        copy.tanggal = `${dd}-${MONTH_SHORT[monthIdx]}-${yyyy}`;
      }
    }

    // Spasi berlebih di awal/akhir/tengah pada ~30% baris
    if (index % 4 === 0) {
      copy.cabang = `  ${copy.cabang.replace(' ', '  ')} `;
    }
    if (index % 5 === 0) {
      copy.namaSales = ` ${copy.namaSales}  `;
    }

    // Kapitalisasi tidak konsisten
    if (index % 7 === 0) {
      copy.kategori = copy.kategori.toLowerCase();
    } else if (index % 11 === 0) {
      copy.cabang = copy.cabang.toUpperCase();
    }

    dirtyRows.push(copy);

    // Sisipkan 25 baris duplikat tersebar
    if (index % 20 === 5 && dirtyRows.length < cleanRows.length + 25) {
      dirtyRows.push({ ...copy });
    }
  });

  // Gabung dan acak ringan urutan duplikat agar realistis
  for (let i = dirtyRows.length - 1; i > 0; i--) {
    if (rand() < 0.08) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = dirtyRows[i];
      dirtyRows[i] = dirtyRows[j];
      dirtyRows[j] = tmp;
    }
  }

  return dirtyRows;
}

export function serializeSalesCsv(rows: SalesRow[]): string {
  const lines = [CSV_HEADERS.map(escapeCsvCell).join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.idTransaksi,
        row.tanggal,
        row.cabang,
        row.kategori,
        row.produk,
        row.jumlah,
        row.hargaSatuan,
        row.diskon,
        row.namaSales,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }
  return lines.join('\n') + '\n';
}
