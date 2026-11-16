import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Moon, Sun, BarChart3 } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { TRACKS } from '../../data/curriculum';
import { getCurriculumStats } from '../../lib/roadmapFilter';
import { useTheme } from '../../context/ThemeContext';

const HERO_IMAGE_URL = '/src/assets/images/hero_datapath_workspace_1794820382560.jpg';

const CHART_DATA = TRACKS.map((track) => ({
  shortName: `T${track.order}`,
  name: track.title,
  jam: track.durationHours,
  modul: track.moduleCount,
  level: track.level,
}));

export function HeroSection() {
  const [chartMetric, setChartMetric] = useState<'jam' | 'modul'>('jam');
  const [imgError, setImgError] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const stats = getCurriculumStats(TRACKS);

  const scrollToSection = (hash: string) => {
    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
          {/* Kolom Kiri: Proposisi Nilai & Aksi Utama */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-between gap-8 lg:col-span-6"
          >
            <div className="space-y-5">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Kurikulum Terstruktur · Bahasa Indonesia · Praktik di Browser
              </p>

              <h1
                className="font-display font-bold tracking-tight text-slate-900 dark:text-slate-50"
                style={{
                  fontSize: 'clamp(2.25rem, 4vw, 3.35rem)',
                  lineHeight: 1.12,
                  textWrap: 'balance',
                }}
              >
                Kuasai Analisis Data dari Nol hingga Mahir, Satu Jalur Terarah.
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
                Mulai dari rumus Excel pertama Anda, lalu melangkah bertahap ke SQL, Python, pandas, statistik, machine learning, dan big data—lengkap dengan latihan interaktif dan studi kasus portofolio.
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-4">
                <Button size="lg" onClick={() => scrollToSection('#roadmap')}>
                  <span>Jelajahi 8 Jalur Belajar</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>

                <a
                  href="#portofolio"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('#portofolio');
                  }}
                  className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-slate-700 underline-offset-4 hover:text-blue-700 hover:underline dark:text-slate-200 dark:hover:text-blue-400"
                >
                  Lihat Portofolio Pembuat
                </a>
              </div>

              {/* Pengalih tema di bawah lipatan aksi agar Top Bar tetap bersih 3 zona */}
              <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
                  className="inline-flex min-h-11 sm:min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Mode Terang</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Mode Gelap</span>
                    </>
                  )}
                </button>
                <span>Tanpa perlu instalasi · Mulai gratis dari Track 1: Excel</span>
              </div>
            </div>
          </motion.div>

          {/* Kolom Kanan: Ilustrasi Ruang Kerja + Grafik Kurikulum Interaktif */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6"
          >
            <Card className="flex h-full flex-col justify-between overflow-hidden bg-slate-50/70 dark:bg-slate-900">
              <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
                {!imgError ? (
                  <img
                    src={HERO_IMAGE_URL}
                    alt="Ilustrasi ruang kerja analisis data dengan tabel spreadsheet, grafik tren, dan alur pemrosesan data"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="h-full w-full object-cover dark:brightness-95"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-blue-50 p-6 text-center dark:from-slate-900 dark:to-slate-800">
                    <BarChart3 className="h-10 w-10 text-blue-700 dark:text-blue-400" aria-hidden="true" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Alur Kerja Analisis Data: Excel · SQL · Python · Big Data
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Distribusi Beban Kurikulum (Track 1–8)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Progresi dari Excel dasar ke arsitektur big data
                    </p>
                  </div>

                  <div
                    role="group"
                    aria-label="Pilih metrik grafik"
                    className="inline-flex items-center rounded-lg bg-slate-200/70 p-1 dark:bg-slate-800"
                  >
                    <button
                      type="button"
                      onClick={() => setChartMetric('jam')}
                      aria-pressed={chartMetric === 'jam'}
                      className={`min-h-11 sm:min-h-8 rounded-md px-3 sm:px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        chartMetric === 'jam'
                          ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-950 dark:text-slate-100'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                      }`}
                    >
                      Estimasi Jam
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMetric('modul')}
                      aria-pressed={chartMetric === 'modul'}
                      className={`min-h-11 sm:min-h-8 rounded-md px-3 sm:px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        chartMetric === 'modul'
                          ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-950 dark:text-slate-100'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                      }`}
                    >
                      Jumlah Modul
                    </button>
                  </div>
                </div>

                <div className="h-40 w-full" aria-label="Grafik beban belajar per jalur">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={CHART_DATA} margin={{ top: 6, right: 8, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="datapathBlueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={theme === 'dark' ? '#3b82f6' : '#1d4ed8'}
                            stopOpacity={0.28}
                          />
                          <stop
                            offset="95%"
                            stopColor={theme === 'dark' ? '#3b82f6' : '#1d4ed8'}
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'}
                      />
                      <XAxis
                        dataKey="shortName"
                        tick={{ fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                          borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                        }}
                        formatter={(value) => [
                          chartMetric === 'jam' ? `${value ?? 0} Jam` : `${value ?? 0} Modul`,
                          chartMetric === 'jam' ? 'Durasi' : 'Cakupan',
                        ]}
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.name ?? ''
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey={chartMetric}
                        stroke={theme === 'dark' ? '#60a5fa' : '#1d4ed8'}
                        strokeWidth={2}
                        fill="url(#datapathBlueFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Strip KPI 4 Kolom di bawah Hero Split */}
        <div className="mt-10 grid grid-cols-2 gap-4 border-t border-slate-200 pt-8 dark:border-slate-800 lg:grid-cols-4 lg:gap-8">
          <div>
            <p className="font-display text-2xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-slate-50">
              {stats.totalTracks} Jalur Belajar
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Dari Excel dasar hingga PySpark
            </p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-slate-50">
              {stats.totalModules} Modul Inti
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Pelajaran, kuis, dan proyek mini
            </p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-slate-50">
              {stats.totalHours} Jam Materi
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Estimasi belajar mandiri fleksibel
            </p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-slate-50">
              4 Mode Lab
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Grid Excel, SQL, Python, dan Kuis
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
