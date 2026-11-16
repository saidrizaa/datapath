import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Search } from 'lucide-react';
import { TRACKS, type TrackItem } from '../../data/curriculum';
import { filterTracks, type LevelFilter } from '../../lib/roadmapFilter';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

const LEVEL_FILTERS: { label: string; value: LevelFilter }[] = [
  { label: 'Semua Level', value: 'Semua' },
  { label: 'Pemula', value: 'Pemula' },
  { label: 'Menengah', value: 'Menengah' },
  { label: 'Lanjut', value: 'Lanjut' },
];

export function RoadmapPreviewSection() {
  const [level, setLevel] = useState<LevelFilter>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlug, setSelectedSlug] = useState<string>(TRACKS[0].slug);

  const visibleTracks = useMemo(
    () => filterTracks(TRACKS, level, searchQuery),
    [level, searchQuery]
  );

  const activeTrack: TrackItem = useMemo(() => {
    const foundInVisible = visibleTracks.find((t) => t.slug === selectedSlug);
    if (foundInVisible) return foundInVisible;
    return visibleTracks[0] ?? TRACKS[0];
  }, [visibleTracks, selectedSlug]);

  const isSelectedAvailable = activeTrack.status === 'available';

  return (
    <section
      id="roadmap"
      className="scroll-mt-20 border-b border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-950 lg:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              Peta Belajar 8 Jalur
            </p>
            <h2
              className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
              style={{ textWrap: 'balance' }}
            >
              Roadmap Analisis Data dari Dasar hingga Skala Besar
            </h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Pilih jalur sesuai tingkat pengalaman Anda. Track 1 (Excel) sudah tersedia penuh dengan 5 pelajaran lengkap, sementara jalur 2–8 segera hadir.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 md:items-end">
            <Link
              to="/roadmap"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400"
            >
              <span>Buka Halaman Roadmap Lengkap</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <div className="text-sm text-slate-500 tabular-nums dark:text-slate-400">
              Menampilkan {visibleTracks.length} dari {TRACKS.length} jalur
            </div>
          </div>
        </div>

        {/* Bilah Filter Level & Pencarian */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="group"
            aria-label="Filter jalur berdasarkan tingkat kesulitan"
            className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900"
          >
            {LEVEL_FILTERS.map((item) => {
              const isActive = level === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setLevel(item.value)}
                  aria-pressed={isActive}
                  className={`min-h-11 sm:min-h-10 rounded-md px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-72">
            <label htmlFor="roadmap-search" className="sr-only">
              Cari jalur atau topik materi
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="roadmap-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari topik, mis. PivotTable, SQL..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Tata Letak Dua Kolom: Daftar 8 Track (Kiri) + Pratinjau Detail Track (Kanan) */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          <div className="space-y-3 lg:col-span-7">
            {visibleTracks.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Tidak ada jalur yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Coba reset filter level atau gunakan kata kunci lain seperti Excel, Python, atau Statistik.
                </p>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLevel('Semua');
                      setSearchQuery('');
                    }}
                  >
                    Tampilkan Semua Jalur
                  </Button>
                </div>
              </Card>
            ) : (
              visibleTracks.map((track) => {
                const isSelected = activeTrack.slug === track.slug;
                const available = track.status === 'available';

                return (
                  <div
                    key={track.id}
                    className={`rounded-xl border transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 dark:border-blue-500 dark:bg-blue-950/25'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-900/80'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedSlug(track.slug)}
                      aria-pressed={isSelected}
                      className="w-full p-5 text-left cursor-pointer"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-mono text-xs font-medium text-slate-500 tabular-nums dark:text-slate-400">
                          Track {String(track.order).padStart(2, '0')} · {track.level} · ± {track.durationHours} Jam
                        </span>
                        <span
                          className={`text-xs font-medium tabular-nums ${
                            available
                              ? 'text-blue-700 dark:text-blue-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {available ? 'Tersedia · 5 Pelajaran' : 'Segera hadir'}
                        </span>
                      </div>

                      <h3 className="mt-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {track.title}
                      </h3>

                      <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {track.summary}
                      </p>

                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        {track.topics.join(' · ')}
                      </p>
                    </button>

                    {/* Pratinjau inline khusus mobile */}
                    {isSelected && (
                      <div className="border-t border-blue-200 px-5 py-4 dark:border-blue-900/60 lg:hidden">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                          Pelajaran ({track.starterLessons.length}) · Proyek: {track.miniProject}
                        </p>
                        <ol className="mt-2 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                          {track.starterLessons.map((lesson, idx) => (
                            <li key={lesson.id}>
                              <span className="mr-1.5 font-mono text-slate-400 tabular-nums">
                                0{idx + 1}
                              </span>
                              {lesson.title}
                            </li>
                          ))}
                        </ol>
                        <div className="mt-4">
                          <Link
                            to={
                              available
                                ? '/belajar/excel/mengenal-excel-dan-data-rapi'
                                : `/roadmap/${track.slug}`
                            }
                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 dark:bg-blue-600"
                          >
                            <span>
                              {available ? 'Mulai Pelajaran 1: Excel' : `Lihat Kerangka ${track.title}`}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Panel Detail Kurikulum Track Terpilih (Desktop) */}
          <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-24">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="font-mono text-xs font-medium text-blue-700 tabular-nums dark:text-blue-400">
                    Track {String(activeTrack.order).padStart(2, '0')} · {activeTrack.level} · Estimasi {activeTrack.durationHours} Jam
                  </p>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                    {activeTrack.title}
                  </h3>
                </div>

                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {activeTrack.summary}
                </p>

                <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Daftar Pelajaran
                    </h4>
                    <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
                      {isSelectedAvailable ? '5 Pelajaran Lengkap' : 'Segera hadir'}
                    </span>
                  </div>

                  <ol className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
                    {activeTrack.starterLessons.map((lesson, idx) => (
                      <li key={lesson.id} className="py-3 first:pt-1 last:pb-1">
                        {lesson.slug ? (
                          <Link
                            to={`/belajar/excel/${lesson.slug}`}
                            className="group flex items-start justify-between gap-3"
                          >
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-400">
                                <span className="mr-2 font-mono text-xs text-slate-400 tabular-nums">
                                  0{idx + 1}
                                </span>
                                {lesson.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Materi MDX + Kuis · ± {lesson.durationMinutes} menit
                              </p>
                            </div>
                          </Link>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              <span className="mr-2 font-mono text-xs text-slate-400 tabular-nums">
                                0{idx + 1}
                              </span>
                              {lesson.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {lesson.practiceType} · ± {lesson.durationMinutes} menit
                            </p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/60">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Proyek Mini Akhir Jalur
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {activeTrack.miniProject}
                  </p>
                </div>

                <div className="pt-1">
                  <Link
                    to={
                      isSelectedAvailable
                        ? '/belajar/excel/mengenal-excel-dan-data-rapi'
                        : `/roadmap/${activeTrack.slug}`
                    }
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {isSelectedAvailable
                        ? 'Mulai Belajar Track 1: Excel'
                        : `Buka Kerangka ${activeTrack.title}`}
                    </span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
