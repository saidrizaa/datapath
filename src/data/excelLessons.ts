import type { ComponentType } from 'react';
import Lesson01Mdx from '../../content/excel/01-mengenal-excel-dan-data-rapi.mdx';
import Lesson02Mdx from '../../content/excel/02-rumus-dan-fungsi-dasar.mdx';
import Lesson03Mdx from '../../content/excel/03-fungsi-bersyarat-dan-lookup.mdx';
import Lesson04Mdx from '../../content/excel/04-membersihkan-data-dan-pivottable.mdx';
import Lesson05Mdx from '../../content/excel/05-visualisasi-dashboard-proyek-mini.mdx';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ExcelLessonMeta {
  id: string;
  order: number;
  slug: string;
  title: string;
  durationMinutes: number;
  moduleTitle: string;
  summary: string;
  hasDirtyDataset?: boolean;
  Component: ComponentType<{ components?: Record<string, ComponentType<any>> }>;
  quiz: QuizQuestion[];
}

export const LESSON_TOC_ITEMS = [
  { id: 'tujuan', label: 'Tujuan' },
  { id: 'penjelasan', label: 'Penjelasan' },
  { id: 'contoh', label: 'Contoh' },
  { id: 'latihan', label: 'Latihan' },
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'sumber-resmi', label: 'Sumber Resmi' },
  { id: 'catatan-pribadi', label: 'Catatan Pribadi' },
  { id: 'kuis', label: 'Kuis 5 Soal' },
] as const;

export const EXCEL_LESSONS: ExcelLessonMeta[] = [
  {
    id: 'excel-01',
    order: 1,
    slug: 'mengenal-excel-dan-data-rapi',
    title: 'Mengenal Excel dan Data yang Rapi',
    durationMinutes: 25,
    moduleTitle: 'Modul 1 · Fondasi Data & Tabel',
    summary:
      'Memahami empat tipe data dasar Excel, tiga aturan Tidy Data Wickham, kebersihan spreadsheet, Excel Table (Ctrl + T), serta Sort & Filter multi-kriteria.',
    Component: Lesson01Mdx,
    quiz: [
      {
        id: 'e1-q1',
        question: 'Jika sebuah angka di sel Excel menempel rata kiri secara bawaan tanpa pengaturan perataan manual, apa kemungkinan penyebabnya?',
        options: [
          'Sel tersebut menggunakan format mata uang Rupiah',
          'Baris tersebut berada di dalam Excel Table',
          'Excel menyimpan nilai tersebut sebagai tipe data teks',
          'Angka tersebut bernilai negatif',
        ],
        correctIndex: 2,
        explanation:
          'Secara bawaan Excel meratakan angka dan tanggal ke kanan, sedangkan teks ke kiri. Angka yang rata kiri menandakan tersimpan sebagai teks dan tidak akan terhitung oleh SUM.',
      },
      {
        id: 'e1-q2',
        question: 'Manakah pernyataan yang menggambarkan tiga aturan Tidy Data menurut Hadley Wickham?',
        options: [
          'Setiap variabel membentuk satu kolom, setiap observasi satu baris, dan setiap jenis unit observasi satu tabel',
          'Menggabungkan nama cabang dan nama sales dalam satu kolom agar ringkas',
          'Mengulang daftar persentase margin kategori di setiap baris tabel transaksi tanpa sheet referensi terpisah',
          'Menyisipkan baris Subtotal di setiap akhir bulan di tengah tabel transaksi mentah',
        ],
        correctIndex: 0,
        explanation:
          'Tiga aturan Tidy Data Wickham adalah satu variabel per kolom, satu observasi per baris, dan satu jenis unit observasi per tabel (misalnya memisahkan tabel referensi Referensi_Kategori dari tabel transaksi). Menghindari merged cells dan baris subtotal adalah praktik kebersihan spreadsheet tambahan.',
      },
      {
        id: 'e1-q3',
        question: 'Apa keuntungan utama mengubah rentang sel biasa menjadi Excel Table dengan Ctrl + T?',
        options: [
          'File otomatis terenkripsi kata sandi',
          'Seluruh teks otomatis diterjemahkan ke bahasa Inggris',
          'Excel menonaktifkan fitur Sort dan Filter',
          'Rumus dan referensi grafik otomatis meluas saat baris baru ditambahkan',
        ],
        correctIndex: 3,
        explanation:
          'Excel Table bersifat dinamis: saat baris transaksi baru ditambahkan di bawahnya, rumus terstruktur dan sumber PivotTable otomatis ikut mencakup baris baru.',
      },
      {
        id: 'e1-q4',
        question: 'Pada dataset Penjualan Toko, mengapa kolom Tanggal yang valid diperlakukan seperti angka oleh Excel?',
        options: [
          'Karena tanggal hanya bisa ditulis dalam format teks',
          'Karena tanggal disimpan sebagai nomor seri harian di balik layar',
          'Karena Excel mengubah tanggal menjadi persentase',
          'Karena tanggal tidak dapat diurutkan secara kronologis',
        ],
        correctIndex: 1,
        explanation:
          'Excel menyimpan tanggal sebagai nomor seri berurutan sejak 1 Januari 1900 sehingga dapat diurutkan kronologis maupun dikurangi untuk menghitung selisih hari.',
      },
      {
        id: 'e1-q5',
        question: 'Bagaimana cara menyaring transaksi cabang Bandung sekaligus mengurutkannya dari Jumlah terbesar ke terkecil?',
        options: [
          'Hapus baris cabang lain secara permanen',
          'Gabungkan semua sel di kolom Cabang',
          'Gunakan Filter pada kolom Cabang untuk memilih Bandung, lalu Sort Largest to Smallest pada kolom Jumlah',
          'Ubah semua angka di kolom Jumlah menjadi teks',
        ],
        correctIndex: 2,
        explanation:
          'Filter menyembunyikan baris yang tidak memenuhi kriteria tanpa menghapus data asli, lalu Sort mengurutkan baris yang lolos filter berdasarkan kolom target.',
      },
    ],
  },
  {
    id: 'excel-02',
    order: 2,
    slug: 'rumus-dan-fungsi-dasar',
    title: 'Rumus dan Fungsi Dasar',
    durationMinutes: 30,
    moduleTitle: 'Modul 1 · Fondasi Data & Tabel',
    summary:
      'Menguasai SUM, AVERAGE, COUNT, COUNTA, MIN, MAX, ROUND, IF, referensi relatif/absolut ($P$1–$P$3), campuran, dan diagnosa error umum.',
    Component: Lesson02Mdx,
    quiz: [
      {
        id: 'e2-q1',
        question: 'Fungsi manakah yang tepat untuk menghitung jumlah baris transaksi pada kolom ID Transaksi yang berisi kode teks seperti TRX-2026-0001?',
        options: ['COUNT', 'COUNTA', 'SUM', 'MIN'],
        correctIndex: 1,
        explanation:
          'COUNT hanya menghitung sel berisi angka, sehingga akan mengembalikan 0 pada kolom teks. Gunakan COUNTA untuk menghitung semua sel yang tidak kosong.',
      },
      {
        id: 'e2-q2',
        question: 'Jika rumus Total Bersih di sel J2 adalah =ROUND(F2*G2*(1-H2)*(1+$P$1)-$P$2, 0) lalu disalin ke sel J3, bagaimana bentuk rumusnya di J3?',
        options: [
          '=ROUND(F3*G3*(1-H3)*(1+$P$2)-$P$3, 0)',
          '=ROUND(F2*G2*(1-H2)*(1+$P$1)-$P$2, 0)',
          '=ROUND(F3*G3*(1-H2)*(1+$P$1)-$P$2, 0)',
          '=ROUND(F3*G3*(1-H3)*(1+$P$1)-$P$2, 0)',
        ],
        correctIndex: 3,
        explanation:
          'F2, G2, dan H2 adalah referensi relatif yang bergeser ke baris 3 (F3, G3, H3), sedangkan $P$1 (tarif pajak) dan $P$2 (biaya admin) tetap terkunci. Jika tanda $ dihapus, P1 akan bergeser menjadi P2 yang berisi 5000 sehingga hasil membengkak drastis.',
      },
      {
        id: 'e2-q3',
        question: 'Apa arti dari referensi campuran $A2 saat rumus disalin ke kolom di sebelah kanannya (dari kolom B ke kolom C)?',
        options: [
          'Kolom A tetap terkunci, sementara baris 2 bisa bergeser jika disalin ke bawah',
          'Baris 2 terkunci mati, sedangkan kolom A bergeser ke B',
          'Baik kolom A maupun baris 2 tidak pernah berubah',
          'Rumus akan menghasilkan error #REF!',
        ],
        correctIndex: 0,
        explanation:
          'Tanda $ berada tepat di depan huruf kolom ($A), sehingga kolom A terkunci saat disalin ke kanan, sementara angka baris 2 tetap relatif.',
      },
      {
        id: 'e2-q4',
        question: 'Anda menulis =AVARAGE(F2:F501) dan Excel menampilkan error #NAME?. Apa penyebabnya?',
        options: [
          'Ada sel kosong di dalam rentang F2:F501',
          'Terjadi pembagian dengan angka nol',
          'Penulisan nama fungsi salah eja (seharusnya AVERAGE)',
          'Kolom target kurang lebar',
        ],
        correctIndex: 2,
        explanation:
          'Error #NAME? muncul ketika Excel tidak mengenali nama fungsi atau referensi teks yang lupa diberi tanda kutip ganda.',
      },
      {
        id: 'e2-q5',
        question: 'Manakah penulisan rumus IF yang benar untuk kolom Status Diskon (K2) agar menampilkan "Ada Diskon" jika Diskon (H2) lebih besar dari 0, dan "Tanpa Diskon" jika tidak?',
        options: [
          '=IF(H2>0, Ada Diskon, Tanpa Diskon)',
          '=IF(H2>0, "Ada Diskon", "Tanpa Diskon")',
          '=IF(H2=0, "Ada Diskon")',
          '=IF("H2>0", "Ada Diskon", "Tanpa Diskon")',
        ],
        correctIndex: 1,
        explanation:
          'Kondisi logika ditulis tanpa tanda kutip (H2>0), sedangkan nilai keluaran berupa teks wajib diapit tanda kutip ganda ("Ada Diskon" dan "Tanpa Diskon"). Pada Excel regional Indonesia, ganti koma pemisah argumen menjadi titik koma (;).',
      },
    ],
  },
  {
    id: 'excel-03',
    order: 3,
    slug: 'fungsi-bersyarat-dan-lookup',
    title: 'Fungsi Bersyarat dan Lookup',
    durationMinutes: 35,
    moduleTitle: 'Modul 2 · Agregasi & Relasi Data',
    summary:
      'Menjawab pertanyaan multi-kriteria dengan SUMIFS, COUNTIFS, AVERAGEIFS (kriteria tanggal $P$3), logika IFS/AND/OR, serta XLOOKUP, INDEX-MATCH, dan VLOOKUP.',
    Component: Lesson03Mdx,
    quiz: [
      {
        id: 'e3-q1',
        question: 'Pada fungsi SUMIFS, di posisi argumen ke berapakah rentang sel yang akan dijumlahkan (sum_range) diletakkan?',
        options: [
          'Di argumen paling pertama',
          'Di argumen paling akhir setelah semua kriteria (seperti SUMIF)',
          'Di argumen kedua setelah kriteria pertama',
          'Urutannya bebas sesuai pilihan pengguna',
        ],
        correctIndex: 0,
        explanation:
          'Berbeda dari SUMIF tunggal yang menaruh sum_range di argumen paling akhir, pada SUMIFS argumen pertama selalu merupakan rentang nilai yang akan dijumlahkan (sum_range).',
      },
      {
        id: 'e3-q2',
        question: 'Mengapa XLOOKUP lebih disarankan dibanding VLOOKUP pada Excel modern?',
        options: [
          'XLOOKUP hanya bisa mencari ke arah kanan',
          'VLOOKUP tidak bisa digunakan pada teks',
          'XLOOKUP bisa mencari ke kiri/kanan, tahan sisip kolom, dan punya argumen jika tidak ditemukan',
          'XLOOKUP otomatis menghapus data duplikat',
        ],
        correctIndex: 2,
        explanation:
          'XLOOKUP memisahkan kolom pencarian dan kolom hasil sehingga aman terhadap penyisipan kolom dan mendukung pencarian dua arah serta pesan fallback.',
      },
      {
        id: 'e3-q3',
        question: 'Jika memakai VLOOKUP di Excel 2019 ke bawah (yang belum memiliki XLOOKUP) untuk mencocokkan ID secara persis, nilai apa yang harus diisi di argumen ke-4?',
        options: ['TRUE atau 1', 'NULL', 'Kosongkan saja', 'FALSE atau 0'],
        correctIndex: 3,
        explanation:
          'XLOOKUP tidak tersedia di Excel 2019 ke bawah, sehingga alternatifnya adalah INDEX-MATCH atau VLOOKUP. Argumen ke-4 bernilai FALSE (atau 0) memastikan VLOOKUP melakukan pencarian persis (exact match).',
      },
      {
        id: 'e3-q4',
        question: 'Apa fungsi baris terakhir TRUE, "Reguler" di dalam rumus =IFS(J2>=10000000, "Prioritas A", J2>=3000000, "Prioritas B", TRUE, "Reguler")?',
        options: [
          'Membuat rumus berjalan dua kali lebih cepat',
          'Bertindak sebagai kondisi sisa (fallback) agar tidak muncul #N/A',
          'Mengubah hasil angka menjadi teks huruf besar',
          'Mengurutkan hasil secara otomatis',
        ],
        correctIndex: 1,
        explanation:
          'IFS mengembalikan #N/A jika tidak ada kondisi yang benar, sehingga TRUE di akhir berfungsi sebagai fallback. Catatan: IFS tidak tersedia di Excel 2016 ke bawah (gunakan nested IF sebagai alternatif).',
      },
      {
        id: 'e3-q5',
        question: 'Manakah rumus yang menghasilkan TRUE hanya jika Cabang (C2) adalah "Medan" DAN Diskon (H2) minimal 0.1?',
        options: [
          '=AND(C2="Medan", H2>=0.1)',
          '=OR(C2="Medan", H2>=0.1)',
          '=IFS(C2="Medan", H2>=0.1)',
          '=COUNTIFS(C2, "Medan")',
        ],
        correctIndex: 0,
        explanation:
          'AND mengembalikan TRUE hanya apabila seluruh kondisi di dalamnya terpenuhi bersamaan, sedangkan OR cukup salah satu saja.',
      },
    ],
  },
  {
    id: 'excel-04',
    order: 4,
    slug: 'membersihkan-data-dan-pivottable',
    title: 'Membersihkan Data dan PivotTable',
    durationMinutes: 40,
    moduleTitle: 'Modul 2 · Pembersihan & Ringkasan Interaktif',
    summary:
      'Menghapus duplikat, membersihkan spasi & CHAR(160), Power Query Using Locale untuk tanggal campuran, Data Validation + Circle Invalid Data, serta PivotTable (Group Months & Years) dan Slicer.',
    hasDirtyDataset: true,
    Component: Lesson04Mdx,
    quiz: [
      {
        id: 'e4-q1',
        question: 'Pada dataset penjualan-toko-kotor.csv, mengapa cabang "Jakarta Selatan" dan "  jakarta selatan " terhitung terpisah di PivotTable, sedangkan "Jakarta Selatan" dan "JAKARTA SELATAN" (tanpa spasi tambahan) digabung?',
        options: [
          'PivotTable hanya bisa membaca 100 baris pertama',
          'PivotTable membedakan huruf besar/kecil tetapi mengabaikan spasi',
          'Karena jumlah unitnya berbeda',
          'PivotTable tidak membedakan huruf besar/kecil, tetapi spasi berlebih di awal/akhir membuat Excel menganggapnya teks berbeda',
        ],
        correctIndex: 3,
        explanation:
          'Di Excel, PivotTable dan Remove Duplicates tidak peka huruf besar/kecil (case-insensitive), sedangkan spasi berlebih memecah kategori menjadi baris terpisah. Namun di pandas dan SQL, huruf besar/kecil dianggap berbeda sehingga kapitalisasi tetap perlu diseragamkan.',
      },
      {
        id: 'e4-q2',
        question: 'Kombinasi fungsi apa yang paling tepat untuk menghapus spasi non-breaking CHAR(160), karakter non-cetak, spasi berlebih, dan merapikan huruf kapital awal kata?',
        options: [
          '=SUM(TRIM(C2))',
          '=PROPER(TRIM(CLEAN(SUBSTITUTE(C2, CHAR(160), " "))))',
          '=COUNT(CLEAN(C2))',
          '=ROUND(PROPER(C2), 0)',
        ],
        correctIndex: 1,
        explanation:
          'SUBSTITUTE(..., CHAR(160), " ") mengubah spasi non-breaking hasil salin web agar bisa dipangkas oleh TRIM, CLEAN membuang karakter non-cetak, dan PROPER merapikan kapitalisasi awal kata.',
      },
      {
        id: 'e4-q3',
        question: 'Setelah memasang Data Validation (List) pada kolom Cabang yang sudah terisi ratusan baris, bagaimana cara menemukan data lama yang tidak sesuai daftar?',
        options: [
          'Data Validation otomatis menghapus data lama yang salah',
          'Gunakan Remove Duplicates untuk menghapus baris yang salah eja',
          'Pilih Data > Data Validation > Circle Invalid Data',
          'Ubah tipe kolom menjadi Text di Power Query',
        ],
        correctIndex: 2,
        explanation:
          'Data Validation hanya menyaring ketikan baru dan tidak memeriksa data yang sudah ada sebelumnya, kecuali Anda memakai fitur Circle Invalid Data untuk menandai sel lama yang melanggar aturan.',
      },
      {
        id: 'e4-q4',
        question: 'Mengapa tanggal berformat campuran (misalnya 2026-03-14 dan 04/03/2026) sebaiknya dibersihkan lewat Power Query Change Type > Using Locale dibanding Text to Columns?',
        options: [
          'Power Query Using Locale mengenali format asal secara eksplisit agar tanggal dd/mm tidak tertukar menjadi mm/dd, sekaligus merekam langkah otomatis untuk Refresh All',
          'Power Query tidak memerlukan kolom judul',
          'Text to Columns hanya bekerja untuk angka di bawah 50 baris',
          'Power Query menggantikan fungsi grafik batang',
        ],
        correctIndex: 0,
        explanation:
          'Text to Columns hanya aman untuk satu pola urutan tanggal seragam. Power Query Using Locale mencegah ambiguitas tertukarnya tanggal dd/mm vs mm/dd dan menyimpan langkah pembersihan secara repeatable.',
      },
      {
        id: 'e4-q5',
        question: 'Saat memasukkan kolom Tanggal ke area Rows di PivotTable, langkah apa yang dianjurkan agar ringkasan bulanan rapi tanpa mencampur tahun yang berbeda?',
        options: [
          'Ubah seluruh tanggal menjadi teks di kolom baru',
          'Letakkan Tanggal ke area Slicer tanpa Rows',
          'Klik kanan tanggal di PivotTable > Group... lalu pilih Months dan Years',
          'Letakkan Tanggal ke area Values dengan Count',
        ],
        correctIndex: 2,
        explanation:
          'Mengelompokkan tanggal dengan Group > Months dan Years memastikan bulan Januari 2025 dan Januari 2026 tidak tergabung dalam satu baris bulan yang sama.',
      },
    ],
  },
  {
    id: 'excel-05',
    order: 5,
    slug: 'visualisasi-dashboard-proyek-mini',
    title: 'Visualisasi, Dashboard, dan Proyek Mini',
    durationMinutes: 45,
    moduleTitle: 'Modul 3 · Visualisasi & Proyek Akhir Track',
    summary:
      'Memilih grafik tepat, menghubungkan KPI ke Pivot_KPI (GETPIVOTDATA & Report Connections), memasang Sparklines/Data Bars di tabel SUMIFS, serta menyusun insight dan screenshot portofolio.',
    Component: Lesson05Mdx,
    quiz: [
      {
        id: 'e5-q1',
        question: 'Jenis grafik manakah yang paling efektif untuk memperlihatkan tren omzet bulanan dari Januari hingga Juni 2026?',
        options: [
          'Pie Chart 3D',
          'Scatter Plot tanpa sumbu waktu',
          'Line Chart (Grafik Garis)',
          'Doughnut Chart dengan 12 segmen',
        ],
        correctIndex: 2,
        explanation:
          'Line Chart memudahkan mata membaca arah kenaikan, penurunan, dan pola musiman secara kronologis dari kiri ke kanan.',
      },
      {
        id: 'e5-q2',
        question: 'Untuk membandingkan peringkat total penjualan di 5 cabang berbeda secara paling akurat, grafik apa yang direkomendasikan?',
        options: [
          'Pie Chart 3D',
          'Radar Chart',
          'Area Chart bertumpuk tanpa label',
          'Bar Chart atau Column Chart',
        ],
        correctIndex: 3,
        explanation:
          'Mata manusia paling akurat membandingkan panjang batang yang sejajar pada Bar/Column Chart dibanding membandingkan sudut pada Pie Chart.',
      },
      {
        id: 'e5-q3',
        question: 'Apa fungsi fitur Sparklines di Excel?',
        options: [
          'Menampilkan grafik tren berukuran mini di dalam satu sel tabel',
          'Menghapus baris duplikat dalam tabel',
          'Menghubungkan workbook ke server SQL',
          'Mengunci rumus dengan tanda dolar',
        ],
        correctIndex: 0,
        explanation:
          'Sparklines adalah grafik garis atau batang mungil di dalam sel tunggal yang efektif memperlihatkan tren tiap kategori pada tabel ringkasan SUMIFS.',
      },
      {
        id: 'e5-q4',
        question: 'Mengapa kartu KPI di Dashboard harus mengambil angka dari PivotTable khusus (Pivot_KPI) melalui GETPIVOTDATA atau Grand Total, bukan langsung memakai =SUM(tbl_penjualan[Total Bersih])?',
        options: [
          'Karena rumus SUM tidak bisa menghitung angka di atas jutaan',
          'Agar kartu KPI ikut berubah dinamis saat pengguna mengklik Slicer lewat Report Connections (selama bersumber dari data yang sama)',
          'Karena Sparklines hanya bisa diletakkan di kartu KPI',
          'Karena Excel melarang SUM dan PivotTable di satu file',
        ],
        correctIndex: 1,
        explanation:
          'Rumus SUM langsung pada tabel sumber mengabaikan filter Slicer. Dengan membuat Pivot_KPI dari sumber tbl_penjualan yang sama dan menghubungkannya lewat Report Connections, KPI selalu sinkron dengan seluruh grafik.',
      },
      {
        id: 'e5-q5',
        question: 'Mengapa Sparklines dan Data Bars sebaiknya diletakkan di atas tabel ringkasan statis berbasis SUMIFS, bukan langsung di atas sel PivotTable?',
        options: [
          'Agar ukuran file menjadi tiga kali lebih besar',
          'Karena Excel melarang grafik berada di lembar yang sama dengan PivotTable',
          'Supaya fungsi Report Connections tidak berjalan',
          'Supaya tata letak sel dan rentang visualisasi tidak bergeser atau rusak ketika baris PivotTable menyusut akibat Slicer',
        ],
        correctIndex: 3,
        explanation:
          'PivotTable dapat berubah jumlah baris/kolomnya saat Slicer difilter, yang berisiko memutus referensi Sparklines dan Conditional Formatting. Tabel ringkasan SUMIFS menjaga posisi sel tetap statis dan aman.',
      },
    ],
  },
];

export function findExcelLessonBySlug(slug?: string): ExcelLessonMeta | undefined {
  if (!slug) return undefined;
  return EXCEL_LESSONS.find((lesson) => lesson.slug === slug);
}
