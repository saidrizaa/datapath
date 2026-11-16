import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Table2,
  XCircle,
} from 'lucide-react';
import {
  evaluateExcelCellInput,
  validateExcelGridAnswers,
  type ExcelCellValidationDetail,
} from '../../lib/exerciseEvaluators';
import { useProgress } from '../../hooks/useProgress';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

export interface ExcelGridRowConfig {
  rowNumber: number;
  idTransaksi: string;
  produk: string;
  jumlah: number;
  hargaSatuan: number;
  diskon: number;
}

export interface GridExcelProps {
  lessonId: string;
  exerciseId: string;
  title?: string;
  description?: string;
  hint?: string;
  taxRate?: number;
  adminFee?: number;
  rows?: ExcelGridRowConfig[];
}

const DEFAULT_ROWS: ExcelGridRowConfig[] = [
  {
    rowNumber: 2,
    idTransaksi: 'TRX-2026-0001',
    produk: 'Monitor IPS 24 Inci',
    jumlah: 2,
    hargaSatuan: 1850000,
    diskon: 0.1,
  },
  {
    rowNumber: 3,
    idTransaksi: 'TRX-2026-0002',
    produk: 'Keyboard Mekanikal TKL',
    jumlah: 4,
    hargaSatuan: 540000,
    diskon: 0.05,
  },
  {
    rowNumber: 4,
    idTransaksi: 'TRX-2026-0003',
    produk: 'Kursi Kerja Jaring',
    jumlah: 1,
    hargaSatuan: 1250000,
    diskon: 0,
  },
];

export function GridExcel({
  lessonId,
  exerciseId,
  title = 'Grid Excel Interaktif — Hitung Total Bersih (Kolom J)',
  description,
  hint,
  taxRate = 0.11,
  adminFee = 5000,
  rows = DEFAULT_ROWS,
}: GridExcelProps) {
  const { saveExercise, getExerciseAttempt } = useProgress();
  const savedAttempt = getExerciseAttempt(lessonId, exerciseId);

  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [activeCell, setActiveCell] = useState<string>(`J${rows[0]?.rowNumber ?? 2}`);
  const [showHint, setShowHint] = useState(false);
  const [validation, setValidation] = useState<{
    allPassed: boolean;
    passedCount: number;
    totalCount: number;
    results: Record<string, ExcelCellValidationDetail>;
  } | null>(null);

  useEffect(() => {
    setInputs({});
    setValidation(null);
    setActiveCell(`J${rows[0]?.rowNumber ?? 2}`);
    setShowHint(false);
  }, [lessonId, exerciseId, rows]);

  const { contextCells, expectedByCell } = useMemo(() => {
    const ctx: Record<string, number> = {
      P1: taxRate,
      P2: adminFee,
    };
    const expected: Record<string, number> = {};

    for (const row of rows) {
      const r = row.rowNumber;
      ctx[`F${r}`] = row.jumlah;
      ctx[`G${r}`] = row.hargaSatuan;
      ctx[`H${r}`] = row.diskon;
      expected[`J${r}`] = Math.round(
        row.jumlah * row.hargaSatuan * (1 - row.diskon) * (1 + taxRate) - adminFee
      );
    }

    return { contextCells: ctx, expectedByCell: expected };
  }, [rows, taxRate, adminFee]);

  const activePreview = useMemo(() => {
    const raw = inputs[activeCell] ?? '';
    if (!raw.trim()) return null;
    return evaluateExcelCellInput(raw, contextCells);
  }, [activeCell, inputs, contextCells]);

  const handleCheck = () => {
    const res = validateExcelGridAnswers(inputs, expectedByCell, contextCells);
    setValidation(res);
    saveExercise(lessonId, exerciseId, 'excel', res.allPassed, JSON.stringify(inputs));
  };

  const handleReset = () => {
    setInputs({});
    setValidation(null);
  };

  return (
    <Card className="mt-6 overflow-hidden border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-medium text-blue-700 dark:text-blue-400">
              <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
              Grid Excel Interaktif
            </span>
            <span aria-hidden="true">·</span>
            <span>Isi rumus (=ROUND(...)) atau nilai angka pada sel kuning</span>
          </div>
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-50">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium">
          {savedAttempt?.status === 'passed' ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Semua Sel Benar
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

        {/* Blok Parameter O1:P2 Sesuai Pelajaran 2 */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex flex-wrap items-center gap-4 font-mono tabular-nums text-slate-700 dark:text-slate-300">
            <span>
              <strong className="text-slate-900 dark:text-slate-100">P1 (Tarif Pajak):</strong>{' '}
              {taxRate}
            </span>
            <span>
              <strong className="text-slate-900 dark:text-slate-100">P2 (Biaya Admin):</strong>{' '}
              {adminFee.toLocaleString('id-ID')}
            </span>
          </div>

          {hint && (
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              aria-expanded={showHint}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline dark:text-blue-400 cursor-pointer"
            >
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{showHint ? 'Tutup Petunjuk' : 'Lihat Petunjuk'}</span>
            </button>
          )}
        </div>

        {showHint && hint && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/70 px-3.5 py-2.5 text-xs leading-relaxed text-slate-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-slate-200">
            {hint}
          </div>
        )}

        {/* Formula Bar Mini */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 font-mono text-xs dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2 min-w-0">
            <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              {activeCell}
            </span>
            <span className="truncate text-slate-600 dark:text-slate-300">
              {inputs[activeCell]?.trim() || '(kosong — klik sel kuning di kolom J)'}
            </span>
          </div>
          {activePreview && (
            <span className="text-slate-600 tabular-nums dark:text-slate-400">
              {activePreview.value !== null
                ? `Hasil hitung: ${activePreview.value.toLocaleString('id-ID')}`
                : activePreview.error}
            </span>
          )}
        </div>

        {/* Spreadsheet CSS Grid */}
        <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700">
          <div className="min-w-[680px]">
            {/* Header Huruf Kolom */}
            <div className="grid grid-cols-[44px_1.1fr_1.4fr_72px_110px_76px_1.5fr] border-b border-slate-300 bg-slate-100 text-center font-mono text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              <div className="border-r border-slate-300 py-1.5 dark:border-slate-700">#</div>
              <div className="border-r border-slate-300 py-1.5 dark:border-slate-700">A</div>
              <div className="border-r border-slate-300 py-1.5 dark:border-slate-700">E</div>
              <div className="border-r border-slate-300 py-1.5 dark:border-slate-700">F</div>
              <div className="border-r border-slate-300 py-1.5 dark:border-slate-700">G</div>
              <div className="border-r border-slate-300 py-1.5 dark:border-slate-700">H</div>
              <div className="bg-amber-100/80 py-1.5 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                J (Target)
              </div>
            </div>

            {/* Baris Header Tabel Data (Baris 1) */}
            <div className="grid grid-cols-[44px_1.1fr_1.4fr_72px_110px_76px_1.5fr] border-b border-slate-300 bg-slate-50 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
              <div className="border-r border-slate-300 py-2 text-center font-mono text-[11px] text-slate-500 dark:border-slate-700">
                1
              </div>
              <div className="border-r border-slate-300 px-3 py-2 dark:border-slate-700">ID Transaksi</div>
              <div className="border-r border-slate-300 px-3 py-2 dark:border-slate-700">Produk</div>
              <div className="border-r border-slate-300 px-2.5 py-2 text-right dark:border-slate-700">Jumlah</div>
              <div className="border-r border-slate-300 px-2.5 py-2 text-right dark:border-slate-700">Harga</div>
              <div className="border-r border-slate-300 px-2.5 py-2 text-right dark:border-slate-700">Diskon</div>
              <div className="bg-amber-50/70 px-3 py-2 text-amber-950 dark:bg-amber-950/30 dark:text-amber-200">
                Total Bersih
              </div>
            </div>

            {/* Baris Data 2, 3, 4 */}
            {rows.map((row) => {
              const cellId = `J${row.rowNumber}`;
              const cellDetail = validation?.results[cellId];

              let inputRing =
                'bg-amber-100/90 text-slate-950 placeholder:text-amber-800/60 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-amber-900/35 dark:text-amber-50 dark:placeholder:text-amber-300/60 dark:focus:ring-blue-400';
              if (cellDetail?.passed) {
                inputRing =
                  'bg-emerald-50 text-emerald-950 ring-1 ring-inset ring-emerald-500 focus:ring-2 focus:ring-blue-600 dark:bg-emerald-950/40 dark:text-emerald-100 dark:focus:ring-blue-400';
              } else if (cellDetail && !cellDetail.passed) {
                inputRing =
                  'bg-rose-50 text-rose-950 ring-1 ring-inset ring-rose-500 focus:ring-2 focus:ring-blue-600 dark:bg-rose-950/40 dark:text-rose-100 dark:focus:ring-blue-400';
              }

              return (
                <div
                  key={cellId}
                  className="grid grid-cols-[44px_1.1fr_1.4fr_72px_110px_76px_1.5fr] border-b border-slate-200 bg-white text-xs last:border-b-0 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="border-r border-slate-200 bg-slate-50 py-2.5 text-center font-mono text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                    {row.rowNumber}
                  </div>
                  <div className="border-r border-slate-200 px-3 py-2.5 font-mono text-slate-700 dark:border-slate-800 dark:text-slate-300">
                    {row.idTransaksi}
                  </div>
                  <div className="border-r border-slate-200 px-3 py-2.5 text-slate-800 dark:border-slate-800 dark:text-slate-200">
                    {row.produk}
                  </div>
                  <div className="border-r border-slate-200 px-2.5 py-2.5 text-right font-mono tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                    {row.jumlah}
                  </div>
                  <div className="border-r border-slate-200 px-2.5 py-2.5 text-right font-mono tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                    {row.hargaSatuan.toLocaleString('id-ID')}
                  </div>
                  <div className="border-r border-slate-200 px-2.5 py-2.5 text-right font-mono tabular-nums text-slate-800 dark:border-slate-800 dark:text-slate-200">
                    {row.diskon}
                  </div>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={inputs[cellId] ?? ''}
                      onFocus={() => setActiveCell(cellId)}
                      onChange={(e) => {
                        setInputs((prev) => ({ ...prev, [cellId]: e.target.value }));
                        setValidation(null);
                      }}
                      placeholder={`Isi rumus/angka ${cellId}`}
                      aria-label={`Sel ${cellId} Total Bersih untuk ${row.produk}`}
                      className={`min-h-11 h-full w-full px-3 py-2 font-mono text-xs tabular-nums focus:outline-none ${inputRing}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button type="button" onClick={handleCheck} size="sm">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>Periksa</span>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset</span>
          </Button>
        </div>

        {validation && (
          <div className="space-y-2.5 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div
              role="status"
              className={`flex items-start gap-2.5 rounded-lg border p-3.5 text-xs leading-relaxed ${
                validation.allPassed
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
                  : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'
              }`}
            >
              {validation.allPassed ? (
                <>
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    <strong>Semua Benar ({validation.passedCount}/{validation.totalCount} sel).</strong> Perhitungan Total Bersih pada kolom J tepat dan status latihan sudah disimpan.
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    <strong>{validation.passedCount} dari {validation.totalCount} sel benar.</strong> Periksa rincian per sel di bawah ini:
                  </span>
                </>
              )}
            </div>

            <ul className="space-y-1.5 text-xs">
              {Object.entries(validation.results).map(([cellId, detail]) => (
                <li
                  key={cellId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 font-mono tabular-nums dark:border-slate-800"
                >
                  <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    {detail.passed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                    )}
                    <strong>{cellId}:</strong>{' '}
                    {detail.computed !== null
                      ? `Hasil Anda ${detail.computed.toLocaleString('id-ID')}`
                      : detail.error || 'Belum diisi'}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {detail.passed ? 'Sesuai' : 'Periksa lagi rumus F·G·(1-H)·(1+$P$1)-$P$2'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
