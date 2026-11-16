import { useState } from 'react';
import { User, ArrowUpRight } from 'lucide-react';
import { CASE_STUDIES, TESTIMONIALS } from '../../data/curriculum';
import { Card } from '../ui/card';

const CREATOR_PHOTO_URL = '/src/assets/images/creator_portrait_1794820383510.jpg';

const CORE_SKILLS = [
  'Microsoft Excel & Power Query',
  'PostgreSQL & BigQuery',
  'Python, pandas & NumPy',
  'Uji Hipotesis & A/B Testing',
  'scikit-learn',
  'Polars & PySpark',
];

export function PortfolioProofSection() {
  const [imgError, setImgError] = useState(false);

  return (
    <section
      id="portofolio"
      className="scroll-mt-20 border-b border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/40 lg:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Bagian 1: Profil Pembuat & Keahlian */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-4">
            <Card className="overflow-hidden p-4">
              <div className="aspect-square w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                {!imgError ? (
                  <img
                    src={CREATOR_PHOTO_URL}
                    alt="Foto profil pembuat DataPath sedang bekerja dengan laptop di ruang kerja"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <User className="h-10 w-10" aria-hidden="true" />
                    <span className="text-xs font-medium">Profil Pengajar & Analis Data</span>
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-1">
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  Riza Said
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Senior Data Analyst & Kurator Kurikulum DataPath
                </p>
              </div>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-8">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                Portofolio & Pengajar
              </p>
              <h2
                className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
                style={{ textWrap: 'balance' }}
              >
                Disusun dari Pengalaman Proyek Analisis Data Dunia Nyata
              </h2>
              <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
                DataPath juga berfungsi sebagai etalase proyek pribadi saya. Setiap materi ajar dibangun berdasarkan tantangan nyata yang sering muncul di perusahaan ritel, logistik, dan produk digital—mulai dari merapikan spreadsheet berantakan hingga membangun pipeline data skala besar.
              </p>
            </div>

            <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Keahlian Utama yang Dibahas & Dipraktikkan
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                {CORE_SKILLS.join(' · ')}
              </p>
            </div>

            {/* 2 Studi Kasus Unggulan */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {CASE_STUDIES.map((cs) => (
                <Card key={cs.id} className="flex flex-col justify-between p-6">
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {cs.domain} · {cs.tools.join(' / ')}
                    </p>
                    <h3 className="font-display text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">
                      {cs.title}
                    </h3>
                    <p className="font-mono text-sm font-semibold text-blue-700 tabular-nums dark:text-blue-400">
                      {cs.metricHighlight}
                    </p>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {cs.problem}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Metode:{' '}
                      </span>
                      {cs.method}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Bagian 2: Testimoni Pembelajar (Claim-to-Proof Adjacency) */}
        <div className="mt-14 border-t border-slate-200 pt-12 dark:border-slate-800">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                Dampak Nyata bagi Pembelajar Awal
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Umpan balik terukur dari praktisi yang menggunakan kerangka kurikulum DataPath.
              </p>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400"
            >
              <span>Lihat arsip kode di GitHub</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {TESTIMONIALS.map((item) => (
              <Card key={item.id} className="p-6">
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {item.beforeState}
                </p>
                <p className="mt-3 text-base font-medium leading-relaxed text-slate-900 dark:text-slate-100">
                  &ldquo;{item.outcome}&rdquo;
                </p>
                <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-slate-200">
                    {item.name}
                  </span>
                  <span aria-hidden="true"> · </span>
                  <span>
                    {item.role}, {item.company}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
