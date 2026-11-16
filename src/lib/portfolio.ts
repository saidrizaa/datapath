import type { TrackItem } from '../data/curriculum';
import { normalizeCompletedLessons } from './progressMigration';

export interface PortfolioProject {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description: string;
  caseStudy: string;
  tags: string[];
  githubUrl: string;
  datasetUrl: string;
  trackSlug: string;
  thumbnailColor: string;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFormInput {
  title: string;
  slug: string;
  description: string;
  caseStudy: string;
  tags: string[];
  githubUrl: string;
  datasetUrl: string;
  trackSlug: string;
  thumbnailColor: string;
  isPublished: boolean;
  displayOrder: number;
}

export interface PublicProfileSummary {
  id: string;
  username: string;
  fullName: string;
  headline: string;
  tagline: string;
  bio: string;
  targetRole: string;
  city: string;
  githubUrl: string;
  linkedinUrl: string;
  avatarUrl: string | null;
  completedTracks: string[];
  xp: number;
  createdAt?: string;
}

export interface PublicPortfolioData {
  profile: PublicProfileSummary;
  projects: PortfolioProject[];
}

export interface ThumbnailColorOption {
  id: string;
  label: string;
  hex: string;
}

export const PROJECT_THUMBNAIL_PALETTE: ThumbnailColorOption[] = [
  { id: 'cobalt', label: 'Biru Kobalt', hex: '#1d4ed8' },
  { id: 'emerald', label: 'Hijau Zamrud', hex: '#047857' },
  { id: 'teal', label: 'Biru Toska', hex: '#0f766e' },
  { id: 'indigo', label: 'Nila Gelap', hex: '#4338ca' },
  { id: 'amber', label: 'Kuning Amber', hex: '#b45309' },
  { id: 'rose', label: 'Merah Delima', hex: '#be123f' },
  { id: 'violet', label: 'Ungu Violet', hex: '#6d28d9' },
  { id: 'slate', label: 'Abu Arang', hex: '#334155' },
];

export const SUGGESTED_PROJECT_TAGS = [
  'Excel',
  'PivotTable',
  'Power Query',
  'SQL',
  'Python',
  'pandas',
  'NumPy',
  'Seaborn',
  'Statistik',
  'scikit-learn',
  'Polars',
] as const;

export const DEFAULT_CASE_STUDY_TEMPLATE = `## Latar Belakang & Masalah
Jelaskan konteks bisnis dan pertanyaan utama yang ingin Anda jawab melalui analisis ini.

## Dataset
- Sumber dataset: ...
- Jumlah baris: ...
- Kolom utama: ...

## Metode & Tools yang Digunakan
Jelaskan alur pembersihan data, rumus atau kueri, serta perangkat yang digunakan.

## Hasil & Temuan Utama
- **Insight 1:** ...
- **Insight 2:** ...
- **Insight 3:** ...
- **Rekomendasi Utama:** ...

## Refleksi & Pembelajaran
Tuliskan tantangan terbesar selama mengerjakan proyek dan perbaikan yang ingin dilakukan ke depan.`;

export function slugifyProjectTitle(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function isValidProjectSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim());
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(username.trim());
}

export function normalizeUsername(raw: string): string {
  return raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

export function resolveUniqueSlug(
  desiredSlug: string,
  existingSlugs: string[],
  excludeSlug?: string
): string {
  const base = slugifyProjectTitle(desiredSlug) || 'proyek-data';
  const taken = new Set(
    existingSlugs
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s && s !== excludeSlug?.trim().toLowerCase())
  );

  if (!taken.has(base)) return base;

  let counter = 2;
  while (taken.has(`${base}-${counter}`)) {
    counter += 1;
  }
  return `${base}-${counter}`;
}

export function isValidOptionalHttpUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateProjectInput(input: ProjectFormInput): string | null {
  const title = input.title.trim();
  const slug = input.slug.trim();
  const description = input.description.trim();
  const caseStudy = input.caseStudy.trim();

  if (!title) return 'Judul proyek wajib diisi.';
  if (title.length > 100) return 'Judul proyek maksimal 100 karakter.';
  if (!slug) return 'Slug URL proyek wajib diisi.';
  if (!isValidProjectSlug(slug)) {
    return 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-).';
  }
  if (!description) return 'Deskripsi singkat proyek wajib diisi.';
  if (description.length > 200) return 'Deskripsi singkat maksimal 200 karakter.';
  if (!caseStudy) return 'Konten studi kasus lengkap wajib diisi.';
  if (!isValidOptionalHttpUrl(input.githubUrl)) {
    return 'Link GitHub harus berupa URL valid (diawali https:// atau http://).';
  }
  if (!isValidOptionalHttpUrl(input.datasetUrl)) {
    return 'Link dataset/sumber harus berupa URL valid (diawali https:// atau http://).';
  }
  return null;
}

export function sortProjectsForGallery(projects: PortfolioProject[]): PortfolioProject[] {
  return [...projects].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }
    return (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0);
  });
}

export function getAdjacentProjects(
  publishedProjects: PortfolioProject[],
  currentSlug: string
): { prev: PortfolioProject | null; next: PortfolioProject | null } {
  const sorted = sortProjectsForGallery(publishedProjects.filter((p) => p.isPublished));
  const idx = sorted.findIndex((p) => p.slug === currentSlug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? sorted[idx - 1] : null,
    next: idx < sorted.length - 1 ? sorted[idx + 1] : null,
  };
}

const TRACK_SKILL_LABELS: Record<string, string> = {
  'excel-analisis-data': 'Excel',
  'sql-basis-data': 'SQL',
  'python-dasar': 'Python Dasar',
  'pandas-numpy': 'pandas & NumPy',
  'visualisasi-data': 'Visualisasi Data',
  'statistik-analisis-data': 'Statistik',
  'machine-learning-dasar': 'Machine Learning',
  'big-data-pipeline': 'Big Data',
};

export interface CompletedTrackSkill {
  trackSlug: string;
  label: string;
  trackTitle: string;
}

export function computeCompletedTrackSlugs(
  tracks: TrackItem[],
  completedLessons: string[]
): string[] {
  const completedSet = new Set(normalizeCompletedLessons(completedLessons));
  const slugs: string[] = [];

  for (const track of tracks) {
    if (track.status !== 'available' || track.starterLessons.length === 0) continue;
    const allDone = track.starterLessons.every((lesson) =>
      completedSet.has(lesson.id)
    );
    if (allDone) {
      slugs.push(track.slug);
    }
  }
  return slugs;
}

export function resolveCompletedTrackSkills(
  tracks: TrackItem[],
  completedTrackSlugs: string[]
): CompletedTrackSkill[] {
  const slugSet = new Set(completedTrackSlugs);
  return tracks
    .filter((t) => slugSet.has(t.slug))
    .map((t) => ({
      trackSlug: t.slug,
      label: TRACK_SKILL_LABELS[t.slug] ?? t.title,
      trackTitle: t.title,
    }));
}
