import { Download, FileSpreadsheet } from 'lucide-react';
import { Card } from '../ui/card';

interface DatasetDownloadBoxProps {
  hasDirtyDataset?: boolean;
}

export function DatasetDownloadBox({ hasDirtyDataset = false }: DatasetDownloadBoxProps) {
  return (
    <Card className="my-6 bg-slate-50/80 p-5 dark:bg-slate-900/70">
      <div
        className={`flex flex-col gap-4 ${
          hasDirtyDataset ? '' : 'md:flex-row md:items-center md:justify-between'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg border border-slate-200 bg-white p-2.5 text-blue-700 dark:border-slate-800 dark:bg-slate-950 dark:text-blue-400">
            <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Dataset Praktik: Penjualan Toko (±500 Baris CSV)
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {hasDirtyDataset
                ? 'Pelajaran 4 menyediakan versi kotor (525 baris dengan duplikat, spasi berlebih, dan format tanggal campuran) untuk latihan pembersihan data, serta versi bersih sebagai acuan.'
                : 'Berisi 500 transaksi dengan 9 kolom: ID Transaksi, Tanggal, Cabang, Kategori, Produk, Jumlah, Harga Satuan, Diskon, dan Nama Sales.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {hasDirtyDataset ? (
            <>
              <a
                key="dirty-csv"
                href="/datasets/penjualan-toko-kotor.csv"
                download="penjualan-toko-kotor.csv"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Unduh Versi Kotor (CSV)</span>
              </a>
              <a
                key="clean-ref-csv"
                href="/datasets/penjualan-toko.csv"
                download="penjualan-toko.csv"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Unduh Versi Bersih (Acuan)</span>
              </a>
            </>
          ) : (
            <a
              key="clean-csv"
              href="/datasets/penjualan-toko.csv"
              download="penjualan-toko.csv"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Unduh penjualan-toko.csv</span>
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
