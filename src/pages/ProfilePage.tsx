import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Flame,
  FolderKanban,
  LogOut,
  Save,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../hooks/useProgress';
import { BADGE_DEFINITIONS } from '../lib/gamification';
import { normalizeUsername } from '../lib/portfolio';
import { EXCEL_LESSONS } from '../data/excelLessons';
import { usePageMeta } from '../lib/seo';
import { BadgesGrid } from '../components/gamification/BadgesGrid';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

function getInitials(name?: string, email?: string): string {
  const source = (name || email || 'DP').trim();
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function formatJoinDate(iso?: string): string {
  if (!iso) return 'Hari ini';
  const ts = Date.parse(iso);
  if (!ts) return 'Hari ini';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(ts));
}

export function ProfilePage() {
  usePageMeta({
    title: 'Profil Pembelajar | DataPath',
    description: 'Atur identitas akun, username portofolio publik, tagline, dan tautan profesional Anda di DataPath.',
    noIndex: true,
  });

  const { user, profile, streak, xpBreakdown, earnedBadges, storageMode, updateProfile, signOut } =
    useAuth();
  const { progress } = useProgress();

  const [activeTab, setActiveTab] = useState<'profil' | 'pencapaian'>('profil');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [tagline, setTagline] = useState('');
  const [headline, setHeadline] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [city, setCity] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [bio, setBio] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setUsername(profile.username);
      setTagline(profile.tagline);
      setHeadline(profile.headline);
      setTargetRole(profile.targetRole);
      setCity(profile.city);
      setGithubUrl(profile.githubUrl);
      setLinkedinUrl(profile.linkedinUrl);
      setBio(profile.bio);
    }
  }, [profile]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Nama lengkap tidak boleh kosong.');
      return;
    }

    setSaving(true);
    const res = await updateProfile({
      fullName,
      username,
      tagline,
      headline,
      targetRole,
      city,
      githubUrl,
      linkedinUrl,
      bio,
    });
    setSaving(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage(res.message ?? 'Perubahan profil disimpan.');
    }
  };

  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'Pembelajar DataPath';
  const displayEmail = profile?.email || user?.email || 'tamu@datapath.local';
  const initials = getInitials(displayName, displayEmail);
  const unlockedBadgesCount = BADGE_DEFINITIONS.filter((b) => Boolean(earnedBadges[b.id])).length;
  const passedExercisesCount = Object.values(progress.exerciseAttempts ?? {}).filter(
    (ex) => ex.status === 'passed'
  ).length;

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Kembali ke Dashboard</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          {profile?.username && (
            <Link
              to={`/portofolio/${profile.username}`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <span>Portofolio Publik</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
          {user ? (
            <>
              <Link
                to="/proyek"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <FolderKanban className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Kelola Proyek</span>
              </Link>
              <Button variant="outline" size="sm" onClick={() => void signOut()}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Keluar</span>
              </Button>
            </>
          ) : (
            <Link
              to="/masuk"
              className="inline-flex min-h-9 items-center rounded-lg bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 dark:bg-blue-600"
            >
              Masuk / Sinkron Supabase
            </Link>
          )}
        </div>
      </div>

      {/* Header Identitas Profil + Avatar Inisial + Total XP */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-blue-200 bg-blue-50 font-display text-xl font-bold text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={displayName}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {displayName}
                </h1>
                <Badge variant="secondary">
                  {storageMode === 'supabase' ? 'Akun Supabase' : 'Mode Lokal'}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{displayEmail}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Bergabung: {formatJoinDate(profile?.createdAt ?? user?.created_at)}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-2.5 text-right dark:border-blue-900/60 dark:bg-blue-950/40">
              <p className="flex items-center justify-end gap-1 text-[11px] font-medium text-blue-700 dark:text-blue-300">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Total XP
              </p>
              <p className="font-display text-xl font-bold text-slate-900 tabular-nums dark:text-slate-50">
                {xpBreakdown.totalXp} XP
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5 text-right dark:border-amber-900/60 dark:bg-amber-950/40">
              <p className="flex items-center justify-end gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                Streak
              </p>
              <p className="font-display text-xl font-bold text-slate-900 tabular-nums dark:text-slate-50">
                🔥 {streak.currentStreak} Hari
              </p>
            </div>
          </div>
        </div>

        {/* Statistik Ringkas */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-200 pt-5 sm:grid-cols-4 dark:border-slate-800">
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Pelajaran Selesai</p>
            <p className="mt-1 font-display text-lg font-bold text-slate-900 tabular-nums dark:text-slate-100">
              {progress.completedLessons.length} / {EXCEL_LESSONS.length}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Kuis Lulus (≥70%)</p>
            <p className="mt-1 font-display text-lg font-bold text-slate-900 tabular-nums dark:text-slate-100">
              {xpBreakdown.passedQuizzesCount}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Latihan Benar</p>
            <p className="mt-1 font-display text-lg font-bold text-slate-900 tabular-nums dark:text-slate-100">
              {passedExercisesCount}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Lencana Diraih</p>
            <p className="mt-1 font-display text-lg font-bold text-slate-900 tabular-nums dark:text-slate-100">
              {unlockedBadgesCount} / {BADGE_DEFINITIONS.length}
            </p>
          </div>
        </div>
      </Card>

      {/* Tab Navigasi: Profil & Statistik vs Pencapaian */}
      <div
        role="tablist"
        aria-label="Bagian halaman profil"
        className="mt-6 inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'profil'}
          onClick={() => setActiveTab('profil')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === 'profil'
              ? 'bg-blue-700 text-white dark:bg-blue-600'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
          }`}
        >
          <User className="h-4 w-4" aria-hidden="true" />
          <span>Edit Profil</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'pencapaian'}
          onClick={() => setActiveTab('pencapaian')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === 'pencapaian'
              ? 'bg-blue-700 text-white dark:bg-blue-600'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
          }`}
        >
          <Award className="h-4 w-4" aria-hidden="true" />
          <span>Pencapaian ({unlockedBadgesCount}/{BADGE_DEFINITIONS.length})</span>
        </button>
      </div>

      {activeTab === 'profil' ? (
        <Card className="mt-6 p-6 sm:p-8">
          <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
              Informasi Profil Pembelajar
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {storageMode === 'supabase'
                ? 'Perubahan disimpan ke tabel profiles di Supabase dengan perlindungan RLS.'
                : 'Saat belum login, perubahan profil disimpan sementara di localStorage browser Anda.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="profile-email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Email Akun
              </label>
              <input
                id="profile-email"
                type="email"
                disabled
                value={displayEmail}
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profile-fullname"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Nama Lengkap
                </label>
                <input
                  id="profile-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama lengkap Anda"
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-username"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Username Portofolio Publik
                </label>
                <input
                  id="profile-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(normalizeUsername(e.target.value))}
                  placeholder="misal: budi-santoso"
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 font-mono text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Link publik:{' '}
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    /portofolio/{normalizeUsername(username) || 'username-anda'}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="profile-tagline"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Tagline Portofolio
                </label>
                <span className="font-mono text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
                  {tagline.length}/150
                </span>
              </div>
              <input
                id="profile-tagline"
                type="text"
                maxLength={150}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Misalnya: Analis Data Junior fokus pada Excel, SQL, dan automasi pelaporan"
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="profile-headline"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Headline Singkat
                </label>
                <input
                  id="profile-headline"
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Pembelajar Analisis Data"
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-target-role"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Target Karier
                </label>
                <input
                  id="profile-target-role"
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="Junior Data Analyst"
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-city"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Kota / Lokasi (Opsional)
                </label>
                <input
                  id="profile-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Jakarta, Indonesia"
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profile-github"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  URL Profil GitHub (Opsional)
                </label>
                <input
                  id="profile-github"
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-linkedin"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  URL Profil LinkedIn (Opsional)
                </label>
                <input
                  id="profile-linkedin"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-bio"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Bio & Fokus Belajar
              </label>
              <textarea
                id="profile-bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ceritakan latar belakang dan tujuan belajar analisis data Anda..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-3.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4" aria-hidden="true" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Profil'}</span>
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <div className="mt-6">
          <BadgesGrid earnedBadges={earnedBadges} />
        </div>
      )}
    </section>
  );
}
