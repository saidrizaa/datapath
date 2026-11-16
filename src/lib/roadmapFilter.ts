import type { TrackItem, TrackLevel } from '../data/curriculum';

export type LevelFilter = 'Semua' | TrackLevel;

export interface CurriculumStats {
  totalTracks: number;
  totalModules: number;
  totalHours: number;
  beginnerCount: number;
  intermediateCount: number;
  advancedCount: number;
}

// Saring daftar track berdasarkan level dan kata kunci pencarian secara deterministik
export function filterTracks(
  tracks: TrackItem[],
  level: LevelFilter,
  query = ''
): TrackItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  return tracks.filter((track) => {
    const matchesLevel = level === 'Semua' || track.level === level;
    if (!matchesLevel) return false;
    if (!normalizedQuery) return true;

    const haystack = [
      track.title,
      track.summary,
      track.miniProject,
      ...track.topics,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

// Hitung ringkasan statistik kurikulum untuk banner metrik dan grafik
export function getCurriculumStats(tracks: TrackItem[]): CurriculumStats {
  return tracks.reduce<CurriculumStats>(
    (acc, track) => {
      acc.totalTracks += 1;
      acc.totalModules += track.moduleCount;
      acc.totalHours += track.durationHours;
      if (track.level === 'Pemula') acc.beginnerCount += 1;
      if (track.level === 'Menengah') acc.intermediateCount += 1;
      if (track.level === 'Lanjut') acc.advancedCount += 1;
      return acc;
    },
    {
      totalTracks: 0,
      totalModules: 0,
      totalHours: 0,
      beginnerCount: 0,
      intermediateCount: 0,
      advancedCount: 0,
    }
  );
}

export function findTrackBySlug(tracks: TrackItem[], slug?: string): TrackItem | undefined {
  if (!slug) return undefined;
  return tracks.find((track) => track.slug === slug);
}
