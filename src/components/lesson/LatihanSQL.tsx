import { useEffect, useId, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  HelpCircle,
  Loader2,
  Play,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import {
  compareSqlResults,
  parseSalesCsvForSql,
  type SqlTableResult,
} from '../../lib/exerciseEvaluators';
import { useProgress } from '../../hooks/useProgress';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

export interface LatihanSQLProps {
  lessonId: string;
  exerciseId: string;
  title?: string;
  description?: string;
  initialQuery: string;
  referenceQuery: string;
  datasetUrl?: string;
  hint?: string;
}

interface SqlDatabaseHandle {
  exec: (sql: string) => Array<{ columns: string[]; values: unknown[][] }>;
}

let cachedDbPromise: Promise<SqlDatabaseHandle> | null = null;

async function loadSalesSqliteDb(datasetUrl: string): Promise<SqlDatabaseHandle> {
  if (!cachedDbPromise) {
    cachedDbPromise = (async () => {
      const [{ default: initSqlJs }, csvResponse] = await Promise.all([
        import('sql.js'),
        fetch(datasetUrl),
      ]);

      if (!csvResponse.ok) {
        throw new Error(`Gagal mengunduh dataset (${csvResponse.status}).`);
      }

      const csvText = await csvResponse.text();
      const rows = parseSalesCsvForSql(csvText);

      const SQL = await initSqlJs({
        locateFile: () => '/sql-wasm.wasm',
      });

      const db = new SQL.Database();
      db.run(`
        CREATE TABLE penjualan (
          id_transaksi TEXT PRIMARY KEY,
          tanggal TEXT,
          cabang TEXT,
          kategori TEXT,
          produk TEXT,
          jumlah INTEGER,
          harga_satuan INTEGER,
          diskon REAL,
          nama_sales TEXT
        );
      `);

      const stmt = db.prepare(
        'INSERT INTO penjualan (id_transaksi, tanggal, cabang, kategori, produk, jumlah, harga_satuan, diskon, nama_sales) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);'
      );

      db.run('BEGIN TRANSACTION;');
      try {
        for (const r of rows) {
          stmt.run([
            r.id_transaksi,
            r.tanggal,
            r.cabang,
            r.kategori,
            r.produk,
            r.jumlah,
            r.harga_satuan,
            r.diskon,
            r.nama_sales,
          ]);
        }
        db.run('COMMIT;');
      } finally {
        stmt.free();
      }

      return db as unknown as SqlDatabaseHandle;
    })().catch((err) => {
      cachedDbPromise = null;
      throw err;
    });
  }

  return cachedDbPromise;
}

function formatSqlCell(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? value.toLocaleString('id-ID')
      : value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
  }
  return String(value);
}

export function LatihanSQL({
  lessonId,
  exerciseId,
  title = 'Latihan SQL In-Browser (sql.js)',
  description,
  initialQuery,
  referenceQuery,
  datasetUrl = '/datasets/penjualan-toko.csv',
  hint,
}: LatihanSQLProps) {
  const inputId = useId();
  const { saveExercise, getExerciseAttempt } = useProgress();
  const savedAttempt = getExerciseAttempt(lessonId, exerciseId);

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<{
    table: SqlTableResult | null;
    passed: boolean;
    reason?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
    setResult(null);
    setShowHint(false);
  }, [lessonId, exerciseId, initialQuery]);

  const handleRun = async () => {
    if (typeof window === 'undefined' || typeof WebAssembly === 'undefined') {
      setResult({
        table: null,
        passed: false,
        error:
          'Browser Anda belum mendukung WebAssembly untuk menjalankan SQLite (sql.js) langsung di browser.',
      });
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResult({
        table: null,
        passed: false,
        error: 'Tuliskan perintah SELECT terlebih dahulu sebelum menjalankan query.',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const db = await loadSalesSqliteDb(datasetUrl);
      const userTables = db.exec(trimmed);
      const actual: SqlTableResult | null =
        userTables.length > 0
          ? {
              columns: userTables[userTables.length - 1].columns,
              values: userTables[userTables.length - 1].values,
            }
          : null;

      const expectedTables = db.exec(referenceQuery);
      const expected: SqlTableResult =
        expectedTables.length > 0
          ? {
              columns: expectedTables[0].columns,
              values: expectedTables[0].values,
            }
          : { columns: [], values: [] };

      const comparison = compareSqlResults(actual, expected);
      setResult({
        table: actual,
        passed: comparison.passed,
        reason: comparison.reason,
      });

      saveExercise(lessonId, exerciseId, 'sql', comparison.passed, trimmed);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal mengeksekusi query SQL.';
      setResult({
        table: null,
        passed: false,
        error: `Kesalahan SQL: ${message}`,
      });
      saveExercise(lessonId, exerciseId, 'sql', false, trimmed);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuery(initialQuery);
    setResult(null);
  };

  const previewRows = result?.table ? result.table.values.slice(0, 50) : [];

  return (
    <Card className="mt-6 overflow-hidden border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-medium text-blue-700 dark:text-blue-400">
              <Database className="h-3.5 w-3.5" aria-hidden="true" />
              Latihan SQL (SQLite / sql.js)
            </span>
            <span aria-hidden="true">·</span>
            <span>Dataset 500 baris penjualan-toko.csv</span>
          </div>
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-50">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium">
          {savedAttempt?.status === 'passed' ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Jawaban Benar
            </span>
          ) : savedAttempt ? (
            <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Sudah Dicoba ({savedAttempt.attemptsCount}x)
            </span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">Belum Dicoba</span>
          )}
        </div>
      </div>

      <div className="space-y-4 p-5">
        {description && (
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {description}
          </p>
        )}

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            Tabel <code className="font-mono">penjualan</code>:
          </span>{' '}
          <code className="font-mono text-[11.5px]">
            id_transaksi, tanggal, cabang, kategori, produk, jumlah, harga_satuan, diskon, nama_sales
          </code>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor={inputId}
              className="text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              Editor Query SQL
            </label>
            {hint && (
              <button
                type="button"
                onClick={() => setShowHint((v) => !v)}
                aria-expanded={showHint}
                className="inline-flex min-h-11 sm:min-h-8 items-center gap-1 px-2 text-xs font-medium text-blue-700 hover:underline dark:text-blue-400 cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{showHint ? 'Tutup Petunjuk' : 'Lihat Petunjuk'}</span>
              </button>
            )}
          </div>

          {showHint && hint && (
            <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50/70 px-3.5 py-2.5 text-xs leading-relaxed text-slate-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-slate-200">
              {hint}
            </div>
          )}

          <textarea
            id={inputId}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={6}
            spellCheck={false}
            aria-label={`Editor query SQL untuk ${title}`}
            className="w-full rounded-xl border border-slate-300 bg-slate-950 p-4 font-mono text-[13px] leading-relaxed text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button type="button" onClick={() => void handleRun()} disabled={loading} size="sm">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{loading ? 'Memuat & Menjalankan...' : 'Jalankan Query'}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={loading}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset</span>
          </Button>
        </div>

        {loading && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-medium text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200"
          >
            <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
            <span>Memuat sql.js dan mengimpor 500 baris penjualan-toko.csv ke SQLite...</span>
          </div>
        )}

        {result && (
          <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            {result.error ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs leading-relaxed text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>{result.error}</p>
              </div>
            ) : (
              <>
                {result.table ? (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600 tabular-nums dark:text-slate-400">
                      Menampilkan {previewRows.length} dari {result.table.values.length} baris hasil
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50 font-mono text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                          <tr>
                            {result.table.columns.map((col, idx) => (
                              <th key={`${col}-${idx}`} className="px-3.5 py-2.5 font-semibold whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-mono tabular-nums dark:divide-slate-800">
                          {previewRows.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className="bg-white hover:bg-slate-50/70 dark:bg-slate-950 dark:hover:bg-slate-900/50"
                            >
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className="px-3.5 py-2 text-slate-800 whitespace-nowrap dark:text-slate-200"
                                >
                                  {formatSqlCell(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Query berhasil dijalankan namun tidak mengembalikan baris data.
                  </p>
                )}

                <div
                  role="status"
                  className={`flex items-start gap-2.5 rounded-lg border p-3.5 text-xs leading-relaxed ${
                    result.passed
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
                      : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'
                  }`}
                >
                  {result.passed ? (
                    <>
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>
                        <strong>Query Benar.</strong> Hasil agregasi sesuai dengan dataset referensi dan status latihan tersimpan.
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>
                        <strong>Hasil Belum Sesuai.</strong> {result.reason}
                      </span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
