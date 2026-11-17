import { useState } from 'react';
import { User, ArrowUpRight } from 'lucide-react';
import { CASE_STUDIES, TESTIMONIALS } from '../../data/curriculum';
import { Card } from '../ui/card';

const CREATOR_PHOTO_URL = '/assets/aistudio/06_Terowongan_Kuno_Beskap_Klasik_fc89a32b.jpg';

const CORE_SKILLS = [
  'Python (LSTM, scikit-learn)',
  'Microsoft Excel & Power Query',
  'Data Mining & Clustering',
  'Time Series Forecasting',
  'pandas & NumPy',
  'Visualisasi Data',
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
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-4">
            <Card className="overflow-hidden p-4">
              <div className="aspect-square w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                {!imgError ? (
                  <img
                    src={CREATOR_PHOTO_URL}
                    alt="Foto profil Mukhamad Said Riza Zudi mengenakan beskap klasik"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="h-full w-full object-cover object-[50%_30%]"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <User className="h-10 w-10" aria-hidden="true" />
                    <span className="text-xs font-medium">Profil Analis Data</span>
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-1">
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  Mukhamad Said Riza Zudi
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Junior Data Analyst & Mahasiswa Sistem Informasi
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
                DataPath juga berfungsi sebagai etalase proyek pribadi saya. Setiap materi dan studi kasus dibangun dari tantangan analisis data nyata—mulai dari peramalan permintaan suku cadang kritis di sektor energi hingga clustering data sosial untuk mendukung kebijakan berbasis data.
              </p>
            </div>

            <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Keahlian Utama
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                {CORE_SKILLS.join(' · ')}
              </p>
            </div>

            {/* 2 Studi Kasus Unggulan */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {CASE_STUDIES.map((cs) => {
                const isSocial = cs.accentTone === 'social';
                const cardAccentClass = isSocial
                  ? 'border-t-2 border-t-emerald-600 dark:border-t-emerald-400'
                  : 'border-t-2 border-t-indigo-600 dark:border-t-indigo-400';
                const highlightTextClass = isSocial
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-indigo-700 dark:text-indigo-400';

                return (
                  <Card key={cs.id} className={`flex flex-col justify-between p-6 ${cardAccentClass}`}>
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {cs.domain} · {cs.tools.join(' / ')}
                      </p>
                      <h3 className="font-display text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">
                        {cs.title}
                      </h3>
                      <p className={`font-mono text-sm font-semibold tabular-nums ${highlightTextClass}`}>
                        {cs.metricHighlight}
                      </p>
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {cs.problem}
                      </p>
                      {cs.highlights && cs.highlights.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Hasil utama:
                          </p>
                          <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                            {cs.highlights.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
                      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Metode:{' '}
                        </span>
                        {cs.method}
                      </p>
                    </div>
                  </Card>
                );
              })}
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
              href="https://github.com/saidrizaa"
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
