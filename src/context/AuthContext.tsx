import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { formatSupabaseError, isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  buildExerciseKey,
  normalizeCompletedLessons,
  normalizeLessonId,
  type ExerciseAttemptRecord,
  type ExerciseType,
  type StreakState,
} from '../lib/progressMigration';
import {
  BADGE_DEFINITIONS,
  calculateXpBreakdown,
  evaluateUnlockedBadges,
  type BadgeDefinition,
  type EarnedBadgeMap,
  type XpBreakdown,
} from '../lib/gamification';
import { EXCEL_LESSONS } from '../data/excelLessons';
import {
  createEmptyProgress,
  fetchAndMigrateSupabaseProgress,
  fetchRemoteEarnedBadges,
  progressService,
  readLocalBadges,
  readLocalStreak,
  saveRemoteExerciseAttempt,
  saveRemoteQuizAttempt,
  setRemoteLessonCompletion,
  syncRemoteGamification,
  touchRemoteDailyStreak,
  writeLocalBadges,
  type ProgressState,
} from '../services/progressService';

import { TRACKS } from '../data/curriculum';
import {
  computeCompletedTrackSlugs,
  isValidOptionalHttpUrl,
  isValidUsername,
  normalizeUsername,
} from '../lib/portfolio';
import {
  fetchUserProjects,
  isSchemaFallbackError,
  isUsernameAvailable,
  readProfileExtrasCache,
  writeProfileExtrasCache,
} from '../services/portfolioService';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  fullName: string;
  headline: string;
  tagline: string;
  bio: string;
  targetRole: string;
  city: string;
  githubUrl: string;
  linkedinUrl: string;
  avatarUrl?: string | null;
  xp: number;
  totalLessonsCompleted: number;
  completedTracks: string[];
  createdAt?: string;
}

interface AuthActionResult {
  error: string | null;
  message?: string;
}

export interface ProfileUpdatePayload {
  fullName: string;
  headline: string;
  targetRole: string;
  bio: string;
  username?: string;
  tagline?: string;
  city?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  streak: StreakState;
  xpBreakdown: XpBreakdown;
  earnedBadges: EarnedBadgeMap;
  publishedProjectsCount: number;
  badgeToastQueue: BadgeDefinition[];
  dismissBadgeToast: (badgeId: string) => void;
  loading: boolean;
  isConfigured: boolean;
  progress: ProgressState;
  storageMode: 'supabase' | 'local';
  syncError: string | null;
  migrationNotice: string | null;
  dismissMigrationNotice: () => void;
  clearSyncError: () => void;
  signInWithPassword: (email: string, password: string) => Promise<AuthActionResult>;
  signUpWithPassword: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<AuthActionResult>;
  signInWithMagicLink: (email: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  updateProfile: (updates: ProfileUpdatePayload) => Promise<AuthActionResult>;
  toggleLessonComplete: (lessonId: string) => Promise<void>;
  saveQuizAttempt: (
    lessonId: string,
    score: number,
    total: number,
    answers: Record<string, number>
  ) => Promise<void>;
  saveExerciseAttempt: (
    lessonId: string,
    exerciseId: string,
    exerciseType: ExerciseType,
    passed: boolean,
    lastSubmission: string
  ) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const DEFAULT_STREAK: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
};

const GUEST_PROFILE_KEY = 'datapath-guest-profile-v1';

function readGuestProfile(): UserProfile {
  const fallback: UserProfile = {
    id: 'local-guest',
    email: 'tamu@datapath.local',
    username: 'pembelajar',
    fullName: 'Pembelajar DataPath',
    headline: 'Pembelajar Analisis Data',
    tagline: 'Belajar analisis data mandiri dari Excel hingga Python',
    bio: 'Belajar analisis data mandiri dari Excel hingga Python.',
    targetRole: 'Junior Data Analyst',
    city: '',
    githubUrl: '',
    linkedinUrl: '',
    avatarUrl: null,
    xp: 0,
    totalLessonsCompleted: 0,
    completedTracks: [],
    createdAt: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(GUEST_PROFILE_KEY);
    if (!raw) {
      window.localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      ...fallback,
      ...parsed,
    };
  } catch {
    return fallback;
  }
}

function writeGuestProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Abaikan jika localStorage diblokir
  }
}

function resolveLessonTitle(lessonId: string): string {
  const canonical = normalizeLessonId(lessonId);
  const found = EXCEL_LESSONS.find((l) => l.id === canonical);
  return found ? `0${found.order}. ${found.title}` : canonical.toUpperCase();
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [guestProfile, setGuestProfile] = useState<UserProfile>(() => readGuestProfile());
  const [remoteStreak, setRemoteStreak] = useState<StreakState>(DEFAULT_STREAK);
  const [localStreak, setLocalStreak] = useState<StreakState>(() => readLocalStreak());
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadgeMap>(() => readLocalBadges());
  const [publishedProjectsCount, setPublishedProjectsCount] = useState<number>(0);
  const [badgeToastQueue, setBadgeToastQueue] = useState<BadgeDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);

  const [localProgress, setLocalProgress] = useState<ProgressState>(() =>
    progressService.getProgress()
  );
  const [remoteProgress, setRemoteProgress] = useState<ProgressState>(() =>
    createEmptyProgress()
  );
  const [syncError, setSyncError] = useState<string | null>(null);
  const [migrationNotice, setMigrationNotice] = useState<string | null>(null);

  const earnedBadgesRef = useRef<EarnedBadgeMap>(earnedBadges);
  earnedBadgesRef.current = earnedBadges;

  // Sinkronkan jumlah proyek yang dipublikasikan untuk badge "Portofolio Perdana" (+50 XP)
  const refreshPublishedProjectsCount = useCallback(async (uid?: string | null) => {
    try {
      const res = await fetchUserProjects(uid);
      setPublishedProjectsCount(res.projects.filter((p) => p.isPublished).length);
    } catch {
      // Abaikan kegagalan latar belakang
    }
  }, []);

  // Dengarkan perubahan localStorage untuk mode tamu / tanpa Supabase dan proyek portofolio
  useEffect(() => {
    const syncLocal = () => setLocalProgress(progressService.getProgress());
    const syncLocalStreak = () => setLocalStreak(readLocalStreak());
    const syncProjects = () => {
      void refreshPublishedProjectsCount(user?.id);
    };
    const unsub = progressService.subscribe(syncLocal);
    window.addEventListener('storage', syncLocal);
    window.addEventListener('datapath-progress-changed', syncLocal);
    window.addEventListener('datapath-streak-changed', syncLocalStreak);
    window.addEventListener('datapath-projects-changed', syncProjects);
    void refreshPublishedProjectsCount(user?.id);
    return () => {
      unsub();
      window.removeEventListener('storage', syncLocal);
      window.removeEventListener('datapath-progress-changed', syncLocal);
      window.removeEventListener('datapath-streak-changed', syncLocalStreak);
      window.removeEventListener('datapath-projects-changed', syncProjects);
    };
  }, [refreshPublishedProjectsCount, user?.id]);

  const loadAccountData = useCallback(async (activeUser: User) => {
    if (!isSupabaseConfigured || !supabase) return;
    const client = supabase;
    setSyncError(null);

    try {
      const fetchProfileRow = async () => {
        const fullQuery = await client
          .from('profiles')
          .select(
            'id, email, username, full_name, headline, tagline, bio, target_role, city, github_url, linkedin_url, avatar_url, xp, completed_tracks, created_at'
          )
          .eq('id', activeUser.id)
          .maybeSingle();

        if (!fullQuery.error) return fullQuery;
        if (isSchemaFallbackError(fullQuery.error)) {
          return client
            .from('profiles')
            .select('id, email, full_name, headline, bio, target_role, avatar_url, xp, created_at')
            .eq('id', activeUser.id)
            .maybeSingle();
        }
        return fullQuery;
      };

      const [profileRes, streakRes, syncResult, badgesMap, projectsRes] = await Promise.all([
        fetchProfileRow(),
        client
          .from('streaks')
          .select('current_streak, longest_streak, last_activity_date')
          .eq('user_id', activeUser.id)
          .maybeSingle(),
        fetchAndMigrateSupabaseProgress(activeUser.id),
        fetchRemoteEarnedBadges(activeUser.id),
        fetchUserProjects(activeUser.id).catch(() => ({ projects: [], mode: 'local' as const })),
      ]);

      if (profileRes.error) {
        throw new Error(formatSupabaseError(profileRes.error));
      }

      const extras = readProfileExtrasCache(activeUser.id);
      const completedTracks = computeCompletedTrackSlugs(
        TRACKS,
        syncResult.progress.completedLessons
      );

      if (profileRes.data) {
        const row = profileRes.data as Record<string, unknown>;
        const nextProfile: UserProfile = {
          id: String(row.id),
          email: String(row.email ?? activeUser.email ?? ''),
          username: String(row.username ?? extras.username ?? ''),
          fullName: String(row.full_name ?? ''),
          headline: String(row.headline ?? 'Pembelajar Analisis Data'),
          tagline: String(row.tagline ?? extras.tagline ?? ''),
          bio: String(row.bio ?? ''),
          targetRole: String(row.target_role ?? 'Junior Data Analyst'),
          city: String(row.city ?? extras.city ?? ''),
          githubUrl: String(row.github_url ?? extras.githubUrl ?? ''),
          linkedinUrl: String(row.linkedin_url ?? extras.linkedinUrl ?? ''),
          avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
          xp: Number(row.xp ?? 0),
          totalLessonsCompleted: syncResult.progress.completedLessons.length,
          completedTracks: Array.isArray(row.completed_tracks)
            ? row.completed_tracks.map((s) => String(s))
            : completedTracks,
          createdAt: row.created_at ? String(row.created_at) : activeUser.created_at,
        };
        setProfile(nextProfile);
        writeProfileExtrasCache(activeUser.id, {
          ...extras,
          username: nextProfile.username,
          tagline: nextProfile.tagline,
          city: nextProfile.city,
          githubUrl: nextProfile.githubUrl,
          linkedinUrl: nextProfile.linkedinUrl,
          completedTracks: nextProfile.completedTracks,
          fullName: nextProfile.fullName,
          headline: nextProfile.headline,
          bio: nextProfile.bio,
          targetRole: nextProfile.targetRole,
          avatarUrl: nextProfile.avatarUrl,
          xp: nextProfile.xp,
          createdAt: nextProfile.createdAt,
        });
      } else {
        setProfile({
          id: activeUser.id,
          email: activeUser.email ?? '',
          username: extras.username ?? '',
          fullName:
            String(activeUser.user_metadata?.full_name ?? '') ||
            (activeUser.email?.split('@')[0] ?? 'Pembelajar'),
          headline: 'Pembelajar Analisis Data',
          tagline: extras.tagline ?? '',
          bio: '',
          targetRole: 'Junior Data Analyst',
          city: extras.city ?? '',
          githubUrl: extras.githubUrl ?? '',
          linkedinUrl: extras.linkedinUrl ?? '',
          avatarUrl: null,
          xp: 0,
          totalLessonsCompleted: syncResult.progress.completedLessons.length,
          completedTracks,
          createdAt: activeUser.created_at,
        });
      }

      if (!streakRes.error && streakRes.data) {
        setRemoteStreak({
          currentStreak: Number(streakRes.data.current_streak ?? 0),
          longestStreak: Number(streakRes.data.longest_streak ?? 0),
          lastActivityDate: streakRes.data.last_activity_date
            ? String(streakRes.data.last_activity_date)
            : null,
        });
      }

      setEarnedBadges(badgesMap);
      setRemoteProgress(syncResult.progress);
      setPublishedProjectsCount(projectsRes.projects.filter((p) => p.isPublished).length);

      if (syncResult.migratedCount > 0) {
        setMigrationNotice(
          `${syncResult.migratedCount} catatan progres lokal Anda berhasil dipindahkan ke akun Supabase tanpa duplikasi.`
        );
      }
    } catch (err) {
      setSyncError(formatSupabaseError(err));
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setSyncError(formatSupabaseError(error));
          setLoading(false);
          return;
        }
        setSession(data.session);
        setUser(data.session?.user ?? null);
        if (data.session?.user) {
          await loadAccountData(data.session.user);
        }
        if (mounted) setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setSyncError(formatSupabaseError(err));
        setLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);

      if (nextUser) {
        void loadAccountData(nextUser);
      } else {
        setProfile(null);
        setRemoteStreak(DEFAULT_STREAK);
        setRemoteProgress(createEmptyProgress());
        setEarnedBadges(readLocalBadges());
        setMigrationNotice(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadAccountData]);

  const signInWithPassword = async (
    email: string,
    password: string
  ): Promise<AuthActionResult> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        error: 'Supabase belum dikonfigurasi. Periksa VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.',
      };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: formatSupabaseError(error) };
      return { error: null, message: 'Berhasil masuk ke akun Anda.' };
    } catch (err) {
      return { error: formatSupabaseError(err) };
    }
  };

  const signUpWithPassword = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<AuthActionResult> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        error: 'Supabase belum dikonfigurasi. Periksa VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.',
      };
    }

    try {
      const redirectTo = `${window.location.origin}/dashboard`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) return { error: formatSupabaseError(error) };

      if (data.session) {
        return { error: null, message: 'Akun berhasil dibuat dan langsung aktif.' };
      }

      return {
        error: null,
        message:
          'Pendaftaran berhasil! Periksa email Anda untuk mengklik tautan konfirmasi sebelum masuk.',
      };
    } catch (err) {
      return { error: formatSupabaseError(err) };
    }
  };

  const signInWithMagicLink = async (email: string): Promise<AuthActionResult> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        error: 'Supabase belum dikonfigurasi. Periksa VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.',
      };
    }

    try {
      const redirectTo = `${window.location.origin}/dashboard`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });
      if (error) return { error: formatSupabaseError(error) };
      return {
        error: null,
        message: `Tautan masuk (Magic Link) telah dikirim ke ${email}. Cek kotak masuk atau folder spam Anda.`,
      };
    } catch (err) {
      return { error: formatSupabaseError(err) };
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      setSyncError(formatSupabaseError(err));
    }
  };

  const updateProfile = async (updates: ProfileUpdatePayload): Promise<AuthActionResult> => {
    const cleanUsername = updates.username !== undefined ? normalizeUsername(updates.username) : undefined;
    if (cleanUsername !== undefined && cleanUsername.length > 0 && !isValidUsername(cleanUsername)) {
      return {
        error: 'Username hanya boleh berisi huruf kecil, angka, dan tanda hubung (minimal 3 karakter).',
      };
    }
    const cleanTagline = updates.tagline !== undefined ? updates.tagline.trim() : undefined;
    if (cleanTagline !== undefined && cleanTagline.length > 150) {
      return { error: 'Tagline maksimal 150 karakter.' };
    }
    const cleanGithub = updates.githubUrl !== undefined ? updates.githubUrl.trim() : undefined;
    if (cleanGithub !== undefined && !isValidOptionalHttpUrl(cleanGithub)) {
      return { error: 'Link GitHub harus berupa URL valid (https://...).' };
    }
    const cleanLinkedin = updates.linkedinUrl !== undefined ? updates.linkedinUrl.trim() : undefined;
    if (cleanLinkedin !== undefined && !isValidOptionalHttpUrl(cleanLinkedin)) {
      return { error: 'Link LinkedIn harus berupa URL valid (https://...).' };
    }

    if (!isSupabaseConfigured || !supabase || !user) {
      const nextGuest: UserProfile = {
        ...guestProfile,
        username: cleanUsername !== undefined ? cleanUsername : guestProfile.username,
        fullName: updates.fullName.trim(),
        headline: updates.headline.trim(),
        tagline: cleanTagline !== undefined ? cleanTagline : guestProfile.tagline,
        targetRole: updates.targetRole.trim(),
        bio: updates.bio.trim(),
        city: updates.city !== undefined ? updates.city.trim() : guestProfile.city,
        githubUrl: cleanGithub !== undefined ? cleanGithub : guestProfile.githubUrl,
        linkedinUrl: cleanLinkedin !== undefined ? cleanLinkedin : guestProfile.linkedinUrl,
      };
      writeGuestProfile(nextGuest);
      setGuestProfile(nextGuest);
      return { error: null, message: 'Profil lokal berhasil disimpan di browser.' };
    }

    if (cleanUsername) {
      const available = await isUsernameAvailable(cleanUsername, user.id);
      if (!available) {
        return { error: `Username "${cleanUsername}" sudah dipakai pengguna lain.` };
      }
    }

    const nextUsername = cleanUsername !== undefined ? cleanUsername : profile?.username ?? '';
    const nextTagline = cleanTagline !== undefined ? cleanTagline : profile?.tagline ?? '';
    const nextCity = updates.city !== undefined ? updates.city.trim() : profile?.city ?? '';
    const nextGithub = cleanGithub !== undefined ? cleanGithub : profile?.githubUrl ?? '';
    const nextLinkedin = cleanLinkedin !== undefined ? cleanLinkedin : profile?.linkedinUrl ?? '';

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email ?? profile?.email ?? '',
            username: nextUsername || null,
            full_name: updates.fullName.trim(),
            headline: updates.headline.trim(),
            tagline: nextTagline,
            target_role: updates.targetRole.trim(),
            bio: updates.bio.trim(),
            city: nextCity,
            github_url: nextGithub,
            linkedin_url: nextLinkedin,
          },
          { onConflict: 'id' }
        );

      if (error) {
        if (isSchemaFallbackError(error)) {
          // Fallback jika kolom Fase 6 belum dijalankan di Supabase SQL Editor
          const basicRes = await supabase
            .from('profiles')
            .upsert(
              {
                id: user.id,
                email: user.email ?? profile?.email ?? '',
                full_name: updates.fullName.trim(),
                headline: updates.headline.trim(),
                target_role: updates.targetRole.trim(),
                bio: updates.bio.trim(),
              },
              { onConflict: 'id' }
            );
          if (basicRes.error) return { error: formatSupabaseError(basicRes.error) };
        } else {
          return { error: formatSupabaseError(error) };
        }
      }

      writeProfileExtrasCache(user.id, {
        ...readProfileExtrasCache(user.id),
        username: nextUsername,
        tagline: nextTagline,
        city: nextCity,
        githubUrl: nextGithub,
        linkedinUrl: nextLinkedin,
        fullName: updates.fullName.trim(),
        headline: updates.headline.trim(),
        targetRole: updates.targetRole.trim(),
        bio: updates.bio.trim(),
      });

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              username: nextUsername,
              fullName: updates.fullName.trim(),
              headline: updates.headline.trim(),
              tagline: nextTagline,
              targetRole: updates.targetRole.trim(),
              bio: updates.bio.trim(),
              city: nextCity,
              githubUrl: nextGithub,
              linkedinUrl: nextLinkedin,
            }
          : null
      );

      return { error: null, message: 'Profil berhasil diperbarui.' };
    } catch (err) {
      return { error: formatSupabaseError(err) };
    }
  };

  const storageMode: 'supabase' | 'local' =
    isSupabaseConfigured && user ? 'supabase' : 'local';

  const activeProgress = storageMode === 'supabase' ? remoteProgress : localProgress;
  const activeStreak = storageMode === 'supabase' ? remoteStreak : localStreak;
  const activeProfile = storageMode === 'supabase' ? profile : guestProfile;

  const xpBreakdown = useMemo(
    () => calculateXpBreakdown(activeProgress, activeStreak, publishedProjectsCount),
    [activeProgress, activeStreak, publishedProjectsCount]
  );

  // Evaluasi badge & sinkronkan XP + user_badges setiap kali progress, streak, atau proyek publik berubah
  useEffect(() => {
    if (loading) return;

    const { earnedMap, newlyUnlockedIds } = evaluateUnlockedBadges(
      activeProgress,
      activeStreak,
      earnedBadgesRef.current,
      new Date().toISOString(),
      publishedProjectsCount
    );

    if (newlyUnlockedIds.length > 0) {
      earnedBadgesRef.current = earnedMap;
      setEarnedBadges(earnedMap);
      writeLocalBadges(earnedMap);

      const newDefs = BADGE_DEFINITIONS.filter((b) => newlyUnlockedIds.includes(b.id));
      if (newDefs.length > 0) {
        setBadgeToastQueue((prev) => {
          const seen = new Set(prev.map((item) => item.id));
          return [...prev, ...newDefs.filter((item) => !seen.has(item.id))];
        });
      }
    }

    const normalizedCompleted = normalizeCompletedLessons(activeProgress.completedLessons);
    const completedTracks = computeCompletedTrackSlugs(TRACKS, normalizedCompleted);

    if (storageMode === 'local') {
      const guestChanged =
        guestProfile.xp !== xpBreakdown.totalXp ||
        JSON.stringify(guestProfile.completedTracks) !== JSON.stringify(completedTracks);
      if (guestChanged) {
        const nextGuest: UserProfile = {
          ...guestProfile,
          xp: xpBreakdown.totalXp,
          totalLessonsCompleted: normalizedCompleted.length,
          completedTracks,
        };
        writeGuestProfile(nextGuest);
        setGuestProfile(nextGuest);
      }
    }

    if (storageMode === 'supabase' && user) {
      writeProfileExtrasCache(user.id, {
        ...readProfileExtrasCache(user.id),
        completedTracks,
        xp: xpBreakdown.totalXp,
      });
      void syncRemoteGamification(
        user.id,
        xpBreakdown.totalXp,
        normalizedCompleted.length,
        earnedMap,
        completedTracks
      ).catch(() => undefined);
    }
  }, [
    activeProgress,
    activeStreak,
    guestProfile,
    loading,
    publishedProjectsCount,
    storageMode,
    user,
    xpBreakdown.totalXp,
  ]);

  const dismissBadgeToast = useCallback((badgeId: string) => {
    setBadgeToastQueue((prev) => prev.filter((b) => b.id !== badgeId));
  }, []);

  const toggleLessonComplete = async (lessonId: string) => {
    setSyncError(null);
    const canonicalId = normalizeLessonId(lessonId);

    if (storageMode === 'local' || !user) {
      progressService.toggleLessonCompletion(canonicalId);
      return;
    }

    const wasCompleted = remoteProgress.completedLessons.includes(canonicalId);
    const nextCompleted = wasCompleted
      ? remoteProgress.completedLessons.filter((id) => id !== canonicalId)
      : Array.from(new Set([...remoteProgress.completedLessons, canonicalId]));
    const nowIso = new Date().toISOString();

    setRemoteProgress((prev) => ({
      ...prev,
      completedLessons: nextCompleted,
      activityLog: wasCompleted
        ? prev.activityLog
        : [
            {
              id: `lesson-${canonicalId}-${Date.now()}`,
              kind: 'lesson' as const,
              lessonId: canonicalId,
              title: `Menyelesaikan Pelajaran ${resolveLessonTitle(canonicalId)}`,
              detail: '+50 XP',
              timestamp: nowIso,
            },
            ...(prev.activityLog ?? []),
          ].slice(0, 200),
      updatedAt: nowIso,
    }));

    try {
      await setRemoteLessonCompletion(user.id, canonicalId, !wasCompleted);
      if (!wasCompleted) {
        const nextStreak = await touchRemoteDailyStreak(user.id).catch(() => null);
        if (nextStreak) setRemoteStreak(nextStreak);
      }
    } catch (err) {
      setRemoteProgress((prev) => ({
        ...prev,
        completedLessons: wasCompleted
          ? Array.from(new Set([...prev.completedLessons, canonicalId]))
          : prev.completedLessons.filter((id) => id !== canonicalId),
      }));
      setSyncError(formatSupabaseError(err));
    }
  };

  const saveQuizAttempt = async (
    lessonId: string,
    score: number,
    total: number,
    answers: Record<string, number>
  ) => {
    setSyncError(null);
    const canonicalId = normalizeLessonId(lessonId);

    if (storageMode === 'local' || !user) {
      progressService.saveQuizAttempt(canonicalId, score, total, answers);
      return;
    }

    const previousAttempt = remoteProgress.quizAttempts[canonicalId];
    const nowIso = new Date().toISOString();
    const passed = total > 0 && score / total >= 0.7;
    const nextRecord = {
      score,
      total,
      answers,
      completedAt: nowIso,
    };

    setRemoteProgress((prev) => ({
      ...prev,
      quizAttempts: {
        ...prev.quizAttempts,
        [canonicalId]: nextRecord,
      },
      activityLog: [
        {
          id: `quiz-${canonicalId}-${Date.now()}`,
          kind: 'quiz' as const,
          lessonId: canonicalId,
          title: `Kuis ${resolveLessonTitle(canonicalId)}`,
          detail: `Skor ${score}/${total}${passed ? ' (Lulus +30 XP)' : ''}`,
          timestamp: nowIso,
        },
        ...(prev.activityLog ?? []),
      ].slice(0, 200),
      updatedAt: nowIso,
    }));

    try {
      await saveRemoteQuizAttempt(user.id, canonicalId, score, total, answers);
      const nextStreak = await touchRemoteDailyStreak(user.id).catch(() => null);
      if (nextStreak) setRemoteStreak(nextStreak);
    } catch (err) {
      setRemoteProgress((prev) => {
        const reverted = { ...prev.quizAttempts };
        if (previousAttempt) {
          reverted[canonicalId] = previousAttempt;
        } else {
          delete reverted[canonicalId];
        }
        return { ...prev, quizAttempts: reverted };
      });
      setSyncError(formatSupabaseError(err));
    }
  };

  const saveExerciseAttempt = async (
    lessonId: string,
    exerciseId: string,
    exerciseType: ExerciseType,
    passed: boolean,
    lastSubmission: string
  ) => {
    setSyncError(null);
    const canonicalLessonId = normalizeLessonId(lessonId);

    if (storageMode === 'local' || !user) {
      progressService.saveExerciseAttempt(
        canonicalLessonId,
        exerciseId,
        exerciseType,
        passed,
        lastSubmission
      );
      return;
    }

    const key = buildExerciseKey(canonicalLessonId, exerciseId);
    const existing = remoteProgress.exerciseAttempts[key];
    const nowIso = new Date().toISOString();

    const nextRecord: ExerciseAttemptRecord = {
      lessonId: canonicalLessonId,
      exerciseId: exerciseId.trim(),
      exerciseType,
      status: existing?.status === 'passed' || passed ? 'passed' : 'attempted',
      attemptsCount: (existing?.attemptsCount ?? 0) + 1,
      lastSubmission: lastSubmission.slice(0, 2000),
      updatedAt: nowIso,
      passedAt: existing?.passedAt ?? (passed ? nowIso : undefined),
    };

    const typeLabel =
      exerciseType === 'python' ? 'Python' : exerciseType === 'sql' ? 'SQL' : 'Grid Excel';

    setRemoteProgress((prev) => ({
      ...prev,
      exerciseAttempts: {
        ...prev.exerciseAttempts,
        [key]: nextRecord,
      },
      activityLog: [
        {
          id: `ex-${key}-${Date.now()}`,
          kind: 'exercise' as const,
          lessonId: canonicalLessonId,
          title: `Latihan ${typeLabel} (${resolveLessonTitle(canonicalLessonId)})`,
          detail: passed ? 'Jawaban benar (+20 XP)' : 'Percobaan dicatat',
          timestamp: nowIso,
        },
        ...(prev.activityLog ?? []),
      ].slice(0, 200),
      updatedAt: nowIso,
    }));

    try {
      await saveRemoteExerciseAttempt(user.id, nextRecord);
      const nextStreak = await touchRemoteDailyStreak(user.id).catch(() => null);
      if (nextStreak) setRemoteStreak(nextStreak);
    } catch (err) {
      setSyncError(formatSupabaseError(err));
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await loadAccountData(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile: activeProfile,
        streak: activeStreak,
        xpBreakdown,
        earnedBadges,
        publishedProjectsCount,
        badgeToastQueue,
        dismissBadgeToast,
        loading,
        isConfigured: isSupabaseConfigured,
        progress: activeProgress,
        storageMode,
        syncError,
        migrationNotice,
        dismissMigrationNotice: () => setMigrationNotice(null),
        clearSyncError: () => setSyncError(null),
        signInWithPassword,
        signUpWithPassword,
        signInWithMagicLink,
        signOut,
        updateProfile,
        toggleLessonComplete,
        saveQuizAttempt,
        saveExerciseAttempt,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return ctx;
}
