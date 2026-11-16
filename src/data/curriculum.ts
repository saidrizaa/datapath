export type TrackLevel = 'Pemula' | 'Menengah' | 'Lanjut';
export type TrackStatus = 'available' | 'coming_soon';

export interface LessonOutline {
  id: string;
  slug?: string;
  title: string;
  durationMinutes: number;
  practiceType: 'Grid Excel' | 'Kueri SQL' | 'Editor Python' | 'Kuis Konsep';
}

export interface TrackItem {
  id: string;
  order: number;
  slug: string;
  title: string;
  level: TrackLevel;
  status: TrackStatus;
  durationHours: number;
  moduleCount: number;
  summary: string;
  topics: string[];
  miniProject: string;
  starterLessons: LessonOutline[];
}

export interface CaseStudyPreview {
  id: string;
  title: string;
  domain: string;
  metricHighlight: string;
  problem: string;
  method: string;
  tools: string[];
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company: string;
  beforeState: string;
  outcome: string;
}

export interface LearningStep {
  number: string;
  title: string;
  description: string;
}

export const LEARNING_STEPS: LearningStep[] = [
  {
    number: '01',
    title: 'Pahami Konsep Secara Ringkas',
    description:
      'Setiap pelajaran disusun lugas tanpa bertele-tele, lengkap dengan ringkasan konsep inti dan tautan langsung ke dokumentasi resmi.',
  },
  {
    number: '02',
    title: 'Praktik Langsung dengan Dataset Nyata',
    description:
      'Unduh dataset transaksi toko 500 baris atau jalankan latihan di browser untuk menguji rumus Excel, kueri SQL, hingga skrip Python.',
  },
  {
    number: '03',
    title: 'Uji Pemahaman Lewat Kuis & Catatan',
    description:
      'Kerjakan kuis 5 soal dengan pembahasan jawaban instan serta tandai pelajaran selesai untuk memantau progres belajar.',
  },
  {
    number: '04',
    title: 'Susun Proyek Portofolio',
    description:
      'Akhiri setiap jalur belajar dengan proyek mini berbasis studi kasus bisnis yang siap ditampilkan di portofolio Anda.',
  },
];

export const TRACKS: TrackItem[] = [
  {
    id: 'track-excel',
    order: 1,
    slug: 'excel-analisis-data',
    title: 'Excel untuk Analisis Data',
    level: 'Pemula',
    status: 'available',
    durationHours: 8,
    moduleCount: 3,
    summary:
      'Bangun fondasi pengolahan data dari nol: prinsip tidy data, rumus & fungsi dasar, fungsi bersyarat & lookup (XLOOKUP/INDEX-MATCH), pembersihan data & PivotTable, hingga dashboard.',
    topics: ['Tidy Data & Excel Table', 'Rumus & Referensi', 'XLOOKUP & SUMIFS', 'Power Query & PivotTable', 'Dashboard'],
    miniProject: 'Dashboard Penjualan Toko Satu Halaman (500 Transaksi)',
    starterLessons: [
      {
        id: 'excel-01',
        slug: 'mengenal-excel-dan-data-rapi',
        title: 'Mengenal Excel dan Data yang Rapi',
        durationMinutes: 25,
        practiceType: 'Grid Excel',
      },
      {
        id: 'excel-02',
        slug: 'rumus-dan-fungsi-dasar',
        title: 'Rumus dan Fungsi Dasar',
        durationMinutes: 30,
        practiceType: 'Grid Excel',
      },
      {
        id: 'excel-03',
        slug: 'fungsi-bersyarat-dan-lookup',
        title: 'Fungsi Bersyarat dan Lookup',
        durationMinutes: 35,
        practiceType: 'Grid Excel',
      },
      {
        id: 'excel-04',
        slug: 'membersihkan-data-dan-pivottable',
        title: 'Membersihkan Data dan PivotTable',
        durationMinutes: 40,
        practiceType: 'Grid Excel',
      },
      {
        id: 'excel-05',
        slug: 'visualisasi-dashboard-proyek-mini',
        title: 'Visualisasi, Dashboard, dan Proyek Mini',
        durationMinutes: 45,
        practiceType: 'Kuis Konsep',
      },
    ],
  },
  {
    id: 'track-sql',
    order: 2,
    slug: 'sql-basis-data',
    title: 'SQL & Basis Data Relasional',
    level: 'Pemula',
    status: 'coming_soon',
    durationHours: 10,
    moduleCount: 4,
    summary:
      'Ekstrak, gabungkan, dan agregasi data langsung dari basis data relasional menggunakan SELECT, JOIN, CTE, hingga Window Functions.',
    topics: ['SELECT & Filtering', 'JOIN Multi-Tabel', 'GROUP BY & HAVING', 'CTE & Window Functions'],
    miniProject: 'Analisis Retensi Pelanggan E-Commerce dengan SQL',
    starterLessons: [
      {
        id: 'sql-1',
        title: 'Anatomi Kueri SELECT, WHERE, dan ORDER BY',
        durationMinutes: 25,
        practiceType: 'Kueri SQL',
      },
      {
        id: 'sql-2',
        title: 'Menggabungkan Relasi dengan INNER dan LEFT JOIN',
        durationMinutes: 30,
        practiceType: 'Kueri SQL',
      },
      {
        id: 'sql-3',
        title: 'Menghitung Metrik Kohort dengan Window Functions',
        durationMinutes: 35,
        practiceType: 'Kueri SQL',
      },
    ],
  },
  {
    id: 'track-python',
    order: 3,
    slug: 'python-dasar',
    title: 'Python Dasar untuk Data',
    level: 'Pemula',
    status: 'coming_soon',
    durationHours: 9,
    moduleCount: 4,
    summary:
      'Pahami logika pemrograman yang relevan bagi analis data: tipe data, list & dictionary, perulangan, fungsi modular, serta pembacaan berkas CSV/JSON.',
    topics: ['Variabel & Tipe Data', 'List & Dictionary', 'Kontrol Alur & Fungsi', 'List Comprehension'],
    miniProject: 'Skrip Pembersih & Parser Log Transaksi Harian',
    starterLessons: [
      {
        id: 'py-1',
        title: 'Variabel, Angka, Teks, dan Operasi Dasar Python',
        durationMinutes: 20,
        practiceType: 'Editor Python',
      },
      {
        id: 'py-2',
        title: 'Mengelola Koleksi Data dengan List dan Dictionary',
        durationMinutes: 30,
        practiceType: 'Editor Python',
      },
      {
        id: 'py-3',
        title: 'Menulis Fungsi Modular untuk Transformasi Data',
        durationMinutes: 30,
        practiceType: 'Editor Python',
      },
    ],
  },
  {
    id: 'track-pandas',
    order: 4,
    slug: 'pandas-numpy',
    title: 'pandas & NumPy',
    level: 'Menengah',
    status: 'coming_soon',
    durationHours: 12,
    moduleCount: 5,
    summary:
      'Manipulasi dataset berskala puluhan hingga ratusan ribu baris dengan cepat: pembersihan missing values, penggabungan tabel, dan operasi vektorisasi.',
    topics: ['Array NumPy', 'DataFrame & Indexing', 'Data Cleaning', 'GroupBy & Pivot', 'Time Series'],
    miniProject: 'Audit Kualitas Data & Analisis Musiman Penjualan',
    starterLessons: [
      {
        id: 'pd-1',
        title: 'Operasi Vektorisasi NumPy vs Perulangan Biasa',
        durationMinutes: 25,
        practiceType: 'Editor Python',
      },
      {
        id: 'pd-2',
        title: 'Seleksi Baris & Kolom dengan loc dan iloc',
        durationMinutes: 30,
        practiceType: 'Editor Python',
      },
      {
        id: 'pd-3',
        title: 'Menangani Data Kosong, Duplikat, dan Tipe Tanggal',
        durationMinutes: 35,
        practiceType: 'Editor Python',
      },
    ],
  },
  {
    id: 'track-viz',
    order: 5,
    slug: 'visualisasi-data',
    title: 'Visualisasi Data & Storytelling',
    level: 'Menengah',
    status: 'coming_soon',
    durationHours: 8,
    moduleCount: 3,
    summary:
      'Pilih jenis grafik yang tepat sesuai pertanyaan bisnis, hilangkan noise visual, dan sampaikan temuan analisis secara meyakinkan kepada pemangku kepentingan.',
    topics: ['Pemilihan Grafik', 'Matplotlib & Seaborn', 'Hierarki Visual', 'Narasi Eksekutif'],
    miniProject: 'Laporan Visual Performa Pengiriman Logistik Nasional',
    starterLessons: [
      {
        id: 'viz-1',
        title: 'Memilih Grafik yang Tepat: Perbandingan, Tren, dan Distribusi',
        durationMinutes: 25,
        practiceType: 'Kuis Konsep',
      },
      {
        id: 'viz-2',
        title: 'Membuat Grafik Publikasi Rapi dengan Seaborn',
        durationMinutes: 35,
        practiceType: 'Editor Python',
      },
    ],
  },
  {
    id: 'track-stats',
    order: 6,
    slug: 'statistik-analisis-data',
    title: 'Statistik untuk Analisis Data',
    level: 'Menengah',
    status: 'coming_soon',
    durationHours: 11,
    moduleCount: 4,
    summary:
      'Ambil keputusan berbasis bukti dengan statistik deskriptif, distribusi probabilitas, interval kepercayaan, uji hipotesis, dan perancangan A/B testing.',
    topics: ['Distribusi & Varians', 'Uji Hipotesis & p-value', 'A/B Testing', 'Korelasi vs Kausalitas'],
    miniProject: 'Evaluasi Eksperimen A/B Halaman Checkout Produk',
    starterLessons: [
      {
        id: 'stat-1',
        title: 'Mean, Median, IQR, dan Jebakan Rata-Rata pada Data Miring',
        durationMinutes: 25,
        practiceType: 'Kuis Konsep',
      },
      {
        id: 'stat-2',
        title: 'Menghitung Statistik Uji-t dan Interpretasi p-value',
        durationMinutes: 35,
        practiceType: 'Editor Python',
      },
    ],
  },
  {
    id: 'track-ml',
    order: 7,
    slug: 'machine-learning-dasar',
    title: 'Machine Learning Dasar (scikit-learn)',
    level: 'Lanjut',
    status: 'coming_soon',
    durationHours: 14,
    moduleCount: 4,
    summary:
      'Bangun dan evaluasi model prediktif menggunakan scikit-learn: regresi linear, klasifikasi pohon keputusan, validasi silang, dan pencegahan data leakage.',
    topics: ['Train-Test Split & Pipeline', 'Regresi & Klasifikasi', 'Metrik Evaluasi', 'Feature Importance'],
    miniProject: 'Model Prediksi Risiko Pelanggan Berhenti Berlangganan',
    starterLessons: [
      {
        id: 'ml-1',
        title: 'Memisahkan Data Latih-Uji dan Mencegah Data Leakage',
        durationMinutes: 30,
        practiceType: 'Editor Python',
      },
      {
        id: 'ml-2',
        title: 'Evaluasi Model Klasifikasi: Precision, Recall, dan ROC-AUC',
        durationMinutes: 35,
        practiceType: 'Kuis Konsep',
      },
    ],
  },
  {
    id: 'track-bigdata',
    order: 8,
    slug: 'big-data-pipeline',
    title: 'Big Data (Polars, PySpark & BigQuery)',
    level: 'Lanjut',
    status: 'coming_soon',
    durationHours: 12,
    moduleCount: 4,
    summary:
      'Tangani dataset multi-juta baris yang melebihi kapasitas memori laptop menggunakan Polars lazy evaluation, arsitektur terdistribusi PySpark, dan partisi BigQuery.',
    topics: ['Polars LazyFrame', 'Dasar PySpark', 'Optimasi Partisi SQL', 'Arsitektur Data Warehouse'],
    miniProject: 'Pipeline Agregasi Data Transaksi 10 Juta Baris dengan Polars',
    starterLessons: [
      {
        id: 'bd-1',
        title: 'Kapan Beralih dari pandas ke Polars atau PySpark',
        durationMinutes: 25,
        practiceType: 'Kuis Konsep',
      },
      {
        id: 'bd-2',
        title: 'Optimasi Kueri dan Biaya Pemindaian di Google BigQuery',
        durationMinutes: 35,
        practiceType: 'Kueri SQL',
      },
    ],
  },
];

export const CASE_STUDIES: CaseStudyPreview[] = [
  {
    id: 'cs-inventory',
    title: 'Optimasi Persediaan & Prediksi Permintaan Ritel FMCG',
    domain: 'Ritel & Rantai Pasok',
    metricHighlight: '+24% Efisiensi Stok dalam 3 Bulan',
    problem:
      'Tingginya kejadian kehabisan stok (stockout) pada produk cepat laku sekaligus penumpukan barang lambat terjual di 18 gudang cabang.',
    method:
      'Pembersihan riwayat penjualan 24 bulan dengan Power Query dan pandas, segmentasi ABC-XYZ, serta perhitungan reorder point dinamis.',
    tools: ['Excel Power Query', 'SQL', 'pandas'],
  },
  {
    id: 'cs-churn',
    title: 'Deteksi Dini Risiko Churn Pelanggan SaaS B2B',
    domain: 'Produk Digital & Retensi',
    metricHighlight: '87,4% ROC-AUC pada Uji Validasi',
    problem:
      'Tim customer success kesulitan memprioritaskan akun berisiko tinggi karena sinyal penurunan aktivitas tersebar di log penggunaan.',
    method:
      'Agregasi perilaku mingguan menggunakan SQL Window Functions dan pemodelan klasifikasi Gradient Boosting di scikit-learn.',
    tools: ['SQL', 'Python', 'scikit-learn'],
  },
];

export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'testi-1',
    name: 'Raka Pratama',
    role: 'Staf Operasional Logistik',
    company: 'PT Nusantara Ekspres',
    beforeState: 'Sebelumnya hanya mengandalkan salin-tempel manual di spreadsheet setiap akhir pekan.',
    outcome:
      'Setelah menyelesaikan Track Excel & SQL, waktu rekap laporan mingguan turun dari 5 jam menjadi 25 menit.',
  },
  {
    id: 'testi-2',
    name: 'Nadia Kusuma',
    role: 'Junior Business Analyst',
    company: 'Karsa Fintech',
    beforeState: 'Kesulitan menjembatani teori statistik kampus dengan kueri bisnis di pekerjaan pertama.',
    outcome:
      'Menggunakan modul A/B testing dan proyek portofolio DataPath sebagai bahan diskusi teknis saat wawancara kerja.',
  },
];

export const FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'Apakah saya harus menginstal Excel, Python, atau database di laptop?',
    answer:
      'Untuk memulai belajar konsep dan mengunduh dataset CSV latihan, Anda bisa langsung membukanya lewat Excel, LibreOffice Calc, atau Google Sheets. Latihan interaktif Python dan SQL langsung di browser juga disiapkan di fase berikutnya.',
  },
  {
    id: 'faq-2',
    question: 'Saya benar-benar pemula dan belum pernah menulis kode. Mulai dari mana?',
    answer:
      'Mulailah dari Track 1 (Excel untuk Analisis Data). Seluruh 5 pelajaran lengkapnya sudah tersedia mulai dari tipe data, rumus dasar, lookup, PivotTable, hingga proyek mini dashboard.',
  },
  {
    id: 'faq-3',
    question: 'Bagaimana progres belajar saya disimpan saat ini?',
    answer:
      'Pada Fase 2, status pelajaran selesai dan skor kuis disimpan di localStorage browser Anda melalui service layer modular yang siap dihubungkan ke Supabase pada Fase 3.',
  },
  {
    id: 'faq-4',
    question: 'Apakah materi di DataPath menyalin dokumentasi resmi?',
    answer:
      'Tidak. Seluruh materi ditulis orisinal dalam Bahasa Indonesia dengan dataset studi kasus toko ritel Indonesia, lalu disertai bagian "Sumber Resmi" berupa tautan ke dokumentasi resmi.',
  },
  {
    id: 'faq-5',
    question: 'Apakah platform ini gratis digunakan?',
    answer:
      'Ya, seluruh jalur belajar, dataset latihan CSV, kuis pemahaman, dan materi DataPath terbuka gratis.',
  },
];
