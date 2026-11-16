import { useState } from 'react';
import { Code2, Database, Table2 } from 'lucide-react';
import { LEARNING_STEPS } from '../../data/curriculum';
import { Card } from '../ui/card';

type LabTab = 'excel' | 'sql' | 'python';

const LAB_PREVIEWS: Record<
  LabTab,
  {
    title: string;
    caption: string;
    codeLabel: string;
    snippet: string;
    output: string;
  }
> = {
  excel: {
    title: 'Grid Rumus Spreadsheet Interaktif',
    caption: 'Latihan langsung menulis SUMIFS, IF, atau XLOOKUP pada sel tabel dan verifikasi hasil otomatis.',
    codeLabel: 'Sel D6 (Rumus Excel)',
    snippet: '=SUMIFS(C2:C15, A2:A15, "Cabang Jakarta", B2:B15, ">=2026-01-01")',
    output: 'Hasil Terhitung: Rp 48.750.000 · Status: Jawaban Tepat',
  },
  sql: {
    title: 'Sandbox Kueri SQL di Browser',
    caption: 'Eksplorasi dataset transaksi relasional menggunakan SELECT, JOIN, GROUP BY, dan Window Functions.',
    codeLabel: 'kueri_retensi.sql',
    snippet: `SELECT kategori, COUNT(*) AS total_order, ROUND(AVG(nilai), 0) AS rata_nilai
FROM transaksi_2026
GROUP BY kategori
ORDER BY total_order DESC;`,
    output: '3 baris dikembalikan · Elektronik (412 order, rata-rata Rp 845.000)',
  },
  python: {
    title: 'Editor Python (Pyodide Runtime)',
    caption: 'Jalankan kode Python dan pandas langsung di browser Anda tanpa setup virtual environment.',
    codeLabel: 'analisis_produk.py',
    snippet: `import pandas as pd

df = pd.DataFrame({"produk": ["A", "B", "A"], "qty": [12, 8, 15]})
print(df.groupby("produk")["qty"].sum())`,
    output: 'produk A: 27 | produk B: 8 · Pemeriksaan unit lulus',
  },
};

export function LearningFlowSection() {
  const [activeTab, setActiveTab] = useState<LabTab>('excel');
  const preview = LAB_PREVIEWS[activeTab];

  return (
    <section
      id="alur-belajar"
      className="scroll-mt-20 border-b border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/40 lg:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
            Alur Belajar Mandiri
          </p>
          <h2
            className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
            style={{ textWrap: 'balance' }}
          >
            Empat Langkah Konsisten dari Teori ke Proyek Nyata
          </h2>
          <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Dirancang agar pemula tidak terjebak menonton video berjam-jam tanpa praktik. Setiap konsep langsung diuji di lingkungan kerja yang relevan.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          {/* Daftar 4 Langkah Editorial Bernomor */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
            {LEARNING_STEPS.map((step) => (
              <Card key={step.number} className="p-6">
                <p className="font-mono text-xs font-semibold text-blue-700 tabular-nums dark:text-blue-400">
                  {step.number}.
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {step.description}
                </p>
              </Card>
            ))}
          </div>

          {/* Pratinjau Mode Latihan Interaktif */}
          <Card className="p-6 lg:col-span-5">
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Pratinjau Lingkungan Latihan
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Pilih mode untuk melihat format latihan yang akan tersedia di halaman pelajaran.
                </p>
              </div>

              <div
                role="tablist"
                aria-label="Mode latihan interaktif"
                className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'excel'}
                  onClick={() => setActiveTab('excel')}
                  className={`inline-flex min-h-11 sm:min-h-10 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'excel'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-950 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Excel</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'sql'}
                  onClick={() => setActiveTab('sql')}
                  className={`inline-flex min-h-11 sm:min-h-10 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'sql'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-950 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  <Database className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>SQL</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'python'}
                  onClick={() => setActiveTab('python')}
                  className={`inline-flex min-h-11 sm:min-h-10 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === 'python'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-950 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Python</span>
                </button>
              </div>

              <div className="space-y-3 pt-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {preview.title}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{preview.caption}</p>

                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-slate-100 dark:border-slate-800">
                  <div className="border-b border-slate-800 px-3.5 py-2 text-xs text-slate-400">
                    {preview.codeLabel}
                  </div>
                  <pre className="overflow-x-auto p-3.5 text-xs leading-relaxed text-slate-100">
                    <code>{preview.snippet}</code>
                  </pre>
                  <div className="border-t border-slate-800 bg-slate-900 px-3.5 py-2.5 font-mono text-xs text-emerald-400">
                    {preview.output}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
