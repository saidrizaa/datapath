import { formatSupabaseError, isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  normalizeUsername,
  resolveUniqueSlug,
  sortProjectsForGallery,
  type PortfolioProject,
  type ProjectFormInput,
  type PublicPortfolioData,
  type PublicProfileSummary,
} from '../lib/portfolio';

export interface ProjectsStorageAdapter {
  read(): string | null;
  write(raw: string): void;
}

const PROJECTS_STORAGE_KEY = 'datapath-projects-v1';
const GUEST_PROFILE_KEY = 'datapath-guest-profile-v1';
const PROFILE_EXTRAS_PREFIX = 'datapath-profile-extras-v1:';

const browserProjectsAdapter: ProjectsStorageAdapter = {
  read() {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  write(raw: string) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PROJECTS_STORAGE_KEY, raw);
    } catch {
      // Abaikan bila localStorage diblokir browser
    }
  },
};

export function isSchemaFallbackError(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  const msg = (err.message ?? '').toLowerCase();
  return (
    err.code === '42P01' ||
    err.code === 'PGRST205' ||
    err.code === '42703' ||
    err.code === 'PGRST204' ||
    (msg.includes('relation') && msg.includes('does not exist')) ||
    msg.includes('could not find the table') ||
    (msg.includes('column') && msg.includes('does not exist')) ||
    msg.includes('could not find the')
  );
}

function generateLocalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function mapSupabaseProjectRow(row: Record<string, unknown>): PortfolioProject {
  return {
    id: String(row.id ?? ''),
    userId: String(row.user_id ?? ''),
    title: String(row.title ?? '').slice(0, 100),
    slug: String(row.slug ?? ''),
    description: String(row.description ?? row.summary ?? '').slice(0, 200),
    caseStudy: String(row.case_study ?? row.methodology ?? ''),
    tags: Array.isArray(row.tags) ? row.tags.map((t) => String(t)) : [],
    githubUrl: String(row.github_url ?? row.repo_url ?? ''),
    datasetUrl: String(row.dataset_url ?? ''),
    trackSlug: String(row.track_slug ?? 'excel-analisis-data'),
    thumbnailColor: String(row.thumbnail_color ?? '#1d4ed8'),
    isPublished: Boolean(row.is_published),
    displayOrder: Number(row.display_order ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export function createProjectsService(adapter: ProjectsStorageAdapter = browserProjectsAdapter) {
  function readAll(): PortfolioProject[] {
    const raw = adapter.read();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as Partial<PortfolioProject>[];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item) => item && typeof item.id === 'string' && typeof item.title === 'string')
        .map((item) => ({
          id: String(item.id),
          userId: String(item.userId ?? 'local-guest'),
          title: String(item.title ?? '').slice(0, 100),
          slug: String(item.slug ?? ''),
          description: String(item.description ?? '').slice(0, 200),
          caseStudy: String(item.caseStudy ?? ''),
          tags: Array.isArray(item.tags) ? item.tags.map((t) => String(t)) : [],
          githubUrl: String(item.githubUrl ?? ''),
          datasetUrl: String(item.datasetUrl ?? ''),
          trackSlug: String(item.trackSlug ?? 'excel-analisis-data'),
          thumbnailColor: String(item.thumbnailColor ?? '#1d4ed8'),
          isPublished: Boolean(item.isPublished),
          displayOrder: Number(item.displayOrder ?? 0),
          createdAt: String(item.createdAt ?? new Date().toISOString()),
          updatedAt: String(item.updatedAt ?? new Date().toISOString()),
        }));
    } catch {
      return [];
    }
  }

  function writeAll(items: PortfolioProject[]) {
    adapter.write(JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('datapath-projects-changed'));
    }
  }

  function listUserProjects(userId: string): PortfolioProject[] {
    return sortProjectsForGallery(readAll().filter((p) => p.userId === userId));
  }

  function saveProject(
    userId: string,
    input: ProjectFormInput,
    existingId?: string
  ): PortfolioProject {
    const all = readAll();
    const userProjects = all.filter((p) => p.userId === userId);
    const existing = existingId ? userProjects.find((p) => p.id === existingId) : undefined;
    const uniqueSlug = resolveUniqueSlug(
      input.slug,
      userProjects.map((p) => p.slug),
      existing?.slug
    );
    const nowIso = new Date().toISOString();

    const record: PortfolioProject = {
      id: existing?.id ?? generateLocalId(),
      userId,
      title: input.title.trim().slice(0, 100),
      slug: uniqueSlug,
      description: input.description.trim().slice(0, 200),
      caseStudy: input.caseStudy,
      tags: input.tags.map((t) => t.trim()).filter(Boolean),
      githubUrl: input.githubUrl.trim(),
      datasetUrl: input.datasetUrl.trim(),
      trackSlug: input.trackSlug || 'excel-analisis-data',
      thumbnailColor: input.thumbnailColor || '#1d4ed8',
      isPublished: Boolean(input.isPublished),
      displayOrder: Number.isFinite(input.displayOrder) ? input.displayOrder : 0,
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
    };

    const next = existing
      ? all.map((p) => (p.id === existing.id ? record : p))
      : [record, ...all];
    writeAll(next);
    return record;
  }

  function togglePublish(userId: string, projectId: string, isPublished: boolean): PortfolioProject | null {
    const all = readAll();
    const target = all.find((p) => p.id === projectId && p.userId === userId);
    if (!target) return null;
    const updated: PortfolioProject = {
      ...target,
      isPublished,
      updatedAt: new Date().toISOString(),
    };
    writeAll(all.map((p) => (p.id === projectId ? updated : p)));
    return updated;
  }

  function deleteProject(userId: string, projectId: string): void {
    const all = readAll();
    writeAll(all.filter((p) => !(p.id === projectId && p.userId === userId)));
  }

  return {
    listUserProjects,
    saveProject,
    togglePublish,
    deleteProject,
  };
}

export const localProjectsService = createProjectsService();

export interface ProfileExtrasCache {
  username?: string;
  tagline?: string;
  city?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  completedTracks?: string[];
  fullName?: string;
  headline?: string;
  bio?: string;
  targetRole?: string;
  avatarUrl?: string | null;
  xp?: number;
  createdAt?: string;
}

export function readProfileExtrasCache(userId: string): ProfileExtrasCache {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(`${PROFILE_EXTRAS_PREFIX}${userId}`);
    if (!raw) return {};
    return JSON.parse(raw) as ProfileExtrasCache;
  } catch {
    return {};
  }
}

export function writeProfileExtrasCache(userId: string, cache: ProfileExtrasCache): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${PROFILE_EXTRAS_PREFIX}${userId}`, JSON.stringify(cache));
  } catch {
    // Abaikan jika localStorage diblokir
  }
}

function findLocalProfileByUsername(username: string): PublicProfileSummary | null {
  if (typeof window === 'undefined') return null;
  const target = normalizeUsername(username);
  if (!target) return null;

  try {
    const guestRaw = window.localStorage.getItem(GUEST_PROFILE_KEY);
    if (guestRaw) {
      const guest = JSON.parse(guestRaw) as Partial<PublicProfileSummary>;
      if (guest.username && normalizeUsername(guest.username) === target) {
        return {
          id: String(guest.id ?? 'local-guest'),
          username: target,
          fullName: String(guest.fullName ?? 'Pembelajar DataPath'),
          headline: String(guest.headline ?? 'Pembelajar Analisis Data'),
          tagline: String(guest.tagline ?? ''),
          bio: String(guest.bio ?? ''),
          targetRole: String(guest.targetRole ?? 'Junior Data Analyst'),
          city: String(guest.city ?? ''),
          githubUrl: String(guest.githubUrl ?? ''),
          linkedinUrl: String(guest.linkedinUrl ?? ''),
          avatarUrl: guest.avatarUrl ? String(guest.avatarUrl) : null,
          completedTracks: Array.isArray(guest.completedTracks) ? guest.completedTracks : [],
          xp: Number(guest.xp ?? 0),
          createdAt: guest.createdAt ? String(guest.createdAt) : undefined,
        };
      }
    }

    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(PROFILE_EXTRAS_PREFIX)) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const cached = JSON.parse(raw) as ProfileExtrasCache;
      if (cached.username && normalizeUsername(cached.username) === target) {
        const userId = key.slice(PROFILE_EXTRAS_PREFIX.length);
        return {
          id: userId,
          username: target,
          fullName: String(cached.fullName ?? 'Pembelajar DataPath'),
          headline: String(cached.headline ?? 'Pembelajar Analisis Data'),
          tagline: String(cached.tagline ?? ''),
          bio: String(cached.bio ?? ''),
          targetRole: String(cached.targetRole ?? 'Junior Data Analyst'),
          city: String(cached.city ?? ''),
          githubUrl: String(cached.githubUrl ?? ''),
          linkedinUrl: String(cached.linkedinUrl ?? ''),
          avatarUrl: cached.avatarUrl ? String(cached.avatarUrl) : null,
          completedTracks: Array.isArray(cached.completedTracks) ? cached.completedTracks : [],
          xp: Number(cached.xp ?? 0),
          createdAt: cached.createdAt,
        };
      }
    }
  } catch {
    return null;
  }

  return null;
}

export async function fetchUserProjects(
  userId?: string | null
): Promise<{ projects: PortfolioProject[]; mode: 'supabase' | 'local' }> {
  const effectiveId = userId || 'local-guest';
  const localItems = localProjectsService.listUserProjects(effectiveId);

  if (!userId || !isSupabaseConfigured || !supabase) {
    return { projects: localItems, mode: 'local' };
  }

  const { data, error } = await supabase
    .from('projects')
    .select(
      'id, user_id, title, slug, description, case_study, tags, github_url, dataset_url, track_slug, thumbnail_color, is_published, display_order, created_at, updated_at'
    )
    .eq('user_id', userId)
    .order('display_order', { ascending: true })
    .order('updated_at', { ascending: false });

  if (error) {
    if (isSchemaFallbackError(error)) {
      return { projects: localItems, mode: 'local' };
    }
    throw new Error(formatSupabaseError(error));
  }

  const remoteItems = (data ?? []).map((row) =>
    mapSupabaseProjectRow(row as Record<string, unknown>)
  );

  // Gabungkan item lokal yang belum tersinkron jika sebelumnya fallback
  const remoteSlugs = new Set(remoteItems.map((p) => p.slug));
  const merged = [...remoteItems, ...localItems.filter((p) => !remoteSlugs.has(p.slug))];

  return {
    projects: sortProjectsForGallery(merged),
    mode: 'supabase',
  };
}

export async function saveUserProject(
  input: ProjectFormInput,
  userId?: string | null,
  existingId?: string
): Promise<{ project: PortfolioProject; mode: 'supabase' | 'local' }> {
  const effectiveId = userId || 'local-guest';

  if (!userId || !isSupabaseConfigured || !supabase) {
    const saved = localProjectsService.saveProject(effectiveId, input, existingId);
    return { project: saved, mode: 'local' };
  }

  // Ambil daftar slug existing user untuk memastikan unik (-2, -3, dst.)
  const { projects: currentProjects } = await fetchUserProjects(userId);
  const existing = existingId ? currentProjects.find((p) => p.id === existingId) : undefined;
  const uniqueSlug = resolveUniqueSlug(
    input.slug,
    currentProjects.map((p) => p.slug),
    existing?.slug
  );

  const payload = {
    user_id: userId,
    title: input.title.trim().slice(0, 100),
    slug: uniqueSlug,
    description: input.description.trim().slice(0, 200),
    case_study: input.caseStudy,
    tags: input.tags.map((t) => t.trim()).filter(Boolean),
    github_url: input.githubUrl.trim() || null,
    dataset_url: input.datasetUrl.trim() || null,
    track_slug: input.trackSlug || 'excel-analisis-data',
    thumbnail_color: input.thumbnailColor || '#1d4ed8',
    is_published: Boolean(input.isPublished),
    display_order: Number.isFinite(input.displayOrder) ? input.displayOrder : 0,
  };

  const query = existingId
    ? supabase
        .from('projects')
        .update(payload)
        .eq('id', existingId)
        .eq('user_id', userId)
        .select(
          'id, user_id, title, slug, description, case_study, tags, github_url, dataset_url, track_slug, thumbnail_color, is_published, display_order, created_at, updated_at'
        )
        .single()
    : supabase
        .from('projects')
        .insert(payload)
        .select(
          'id, user_id, title, slug, description, case_study, tags, github_url, dataset_url, track_slug, thumbnail_color, is_published, display_order, created_at, updated_at'
        )
        .single();

  const { data, error } = await query;

  if (error) {
    if (isSchemaFallbackError(error)) {
      const saved = localProjectsService.saveProject(effectiveId, input, existingId);
      return { project: saved, mode: 'local' };
    }
    throw new Error(formatSupabaseError(error));
  }

  const mapped = mapSupabaseProjectRow(data as Record<string, unknown>);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('datapath-projects-changed'));
  }
  return { project: mapped, mode: 'supabase' };
}

export async function toggleUserProjectPublish(
  projectId: string,
  isPublished: boolean,
  userId?: string | null
): Promise<PortfolioProject | null> {
  const effectiveId = userId || 'local-guest';

  if (!userId || !isSupabaseConfigured || !supabase) {
    return localProjectsService.togglePublish(effectiveId, projectId, isPublished);
  }

  const { data, error } = await supabase
    .from('projects')
    .update({ is_published: isPublished })
    .eq('id', projectId)
    .eq('user_id', userId)
    .select(
      'id, user_id, title, slug, description, case_study, tags, github_url, dataset_url, track_slug, thumbnail_color, is_published, display_order, created_at, updated_at'
    )
    .single();

  if (error) {
    if (isSchemaFallbackError(error)) {
      return localProjectsService.togglePublish(effectiveId, projectId, isPublished);
    }
    throw new Error(formatSupabaseError(error));
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('datapath-projects-changed'));
  }
  return mapSupabaseProjectRow(data as Record<string, unknown>);
}

export async function deleteUserProject(
  projectId: string,
  userId?: string | null
): Promise<void> {
  const effectiveId = userId || 'local-guest';
  localProjectsService.deleteProject(effectiveId, projectId);

  if (!userId || !isSupabaseConfigured || !supabase) {
    return;
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error && !isSchemaFallbackError(error)) {
    throw new Error(formatSupabaseError(error));
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('datapath-projects-changed'));
  }
}

export async function isUsernameAvailable(
  username: string,
  currentUserId?: string | null
): Promise<boolean> {
  const normalized = normalizeUsername(username);
  if (!normalized) return false;
  if (!isSupabaseConfigured || !supabase) return true;

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', normalized)
    .maybeSingle();

  if (error) {
    if (isSchemaFallbackError(error)) return true;
    return true;
  }

  if (!data) return true;
  return Boolean(currentUserId && String(data.id) === currentUserId);
}

export async function fetchPublicPortfolioByUsername(
  username: string,
  viewerUserId?: string | null
): Promise<PublicPortfolioData | null> {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;

  if (isSupabaseConfigured && supabase) {
    const { data: profileRow, error: profileErr } = await supabase
      .from('profiles')
      .select(
        'id, username, full_name, headline, tagline, bio, target_role, city, github_url, linkedin_url, avatar_url, xp, completed_tracks, created_at'
      )
      .ilike('username', normalized)
      .maybeSingle();

    if (!profileErr && profileRow) {
      const ownerId = String(profileRow.id);
      const isOwner = Boolean(viewerUserId && viewerUserId === ownerId);

      let projectsQuery = supabase
        .from('projects')
        .select(
          'id, user_id, title, slug, description, case_study, tags, github_url, dataset_url, track_slug, thumbnail_color, is_published, display_order, created_at, updated_at'
        )
        .eq('user_id', ownerId)
        .order('display_order', { ascending: true })
        .order('updated_at', { ascending: false });

      if (!isOwner) {
        projectsQuery = projectsQuery.eq('is_published', true);
      }

      const { data: projectRows, error: projectErr } = await projectsQuery;
      const remoteProjects =
        !projectErr && Array.isArray(projectRows)
          ? projectRows.map((r) => mapSupabaseProjectRow(r as Record<string, unknown>))
          : localProjectsService
              .listUserProjects(ownerId)
              .filter((p) => isOwner || p.isPublished);

      return {
        profile: {
          id: ownerId,
          username: String(profileRow.username ?? normalized),
          fullName: String(profileRow.full_name ?? 'Pembelajar DataPath'),
          headline: String(profileRow.headline ?? ''),
          tagline: String(profileRow.tagline ?? ''),
          bio: String(profileRow.bio ?? ''),
          targetRole: String(profileRow.target_role ?? ''),
          city: String(profileRow.city ?? ''),
          githubUrl: String(profileRow.github_url ?? ''),
          linkedinUrl: String(profileRow.linkedin_url ?? ''),
          avatarUrl: profileRow.avatar_url ? String(profileRow.avatar_url) : null,
          completedTracks: Array.isArray(profileRow.completed_tracks)
            ? profileRow.completed_tracks.map((s) => String(s))
            : [],
          xp: Number(profileRow.xp ?? 0),
          createdAt: profileRow.created_at ? String(profileRow.created_at) : undefined,
        },
        projects: sortProjectsForGallery(remoteProjects),
      };
    }

    // Jika tabel/kolom baru belum ada atau belum ditemukan di Supabase, lanjut cek fallback lokal
    if (profileErr && !isSchemaFallbackError(profileErr)) {
      // Tetap cek fallback lokal sebelum mengembalikan null
    }
  }

  const localProfile = findLocalProfileByUsername(normalized);
  if (!localProfile) return null;

  const isOwner = Boolean(viewerUserId && viewerUserId === localProfile.id) || localProfile.id === 'local-guest';
  const localProjects = localProjectsService
    .listUserProjects(localProfile.id)
    .filter((p) => isOwner || p.isPublished);

  return {
    profile: localProfile,
    projects: sortProjectsForGallery(localProjects),
  };
}
