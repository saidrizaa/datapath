import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  FolderKanban,
  Github,
  Linkedin,
  MapPin,
  Share2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TRACKS } from '../data/curriculum';
import { usePageMeta } from '../lib/seo';
import {
  computeCompletedTrackSlugs,
  resolveCompletedTrackSkills,
  type PublicPortfolioData,
} from '../lib/portfolio';
import { fetchPublicPortfolioByUsername } from '../services/portfolioService';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

function getInitials(name?: string): string {
  const source = (name || 'DP').trim();
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function PublicPortfolioPage() {
  const { username = '' } = useParams<{ username: string }>();
  const { user, profile: viewerProfile, progress } = useAuth();

  const [portfolio, setPortfolio] = useState<PublicPortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPublicPortfolioByUsername(username, user?.id)
      .then((res) => {
        if (active) {
          setPortfolio(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setPortfolio(null);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [username, user?.id]);

  const pageTitle = portfolio
    ? `${portfolio.profile.fullName} (@${portfolio.profile.username}) — Portofolio Analisis Data`
    : 'Portofolio Tidak Ditemukan — DataPath';
  const pageDescription = portfolio
    ? portfolio.profile.tagline ||
      portfolio.profile.bio ||
      `Lihat portofolio analisis data dan studi kasus proyek ${portfolio.profile.fullName} di DataPath.`
    : 'Halaman portofolio pembelajar yang Anda cari tidak ditemukan atau username belum diatur.';

  usePageMeta({
    title: pageTitle,
    description: pageDescription,
    ogType: 'profile',
  });

  const isOwner = Boolean(
    portfolio &&
      ((user && user.id === portfolio.profile.id) ||
        (!user &&
          viewerProfile?.username &&
          viewerProfile.username.toLowerCase() === portfolio.profile.username.toLowerCase()))
  );

  const skillBadges = useMemo(() => {
    if (!portfolio) return [];
    const baseSlugs = new Set(portfolio.profile.completedTracks);
    if (isOwner) {
      for (const s of computeCompletedTrackSlugs(TRACKS, progress.completedLessons)) {
        baseSlugs.add(s);
      }
    }
    return resolveCompletedTrackSkills(TRACKS, Array.from(baseSlugs));
  }, [portfolio, isOwner, progress.completedLessons]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/portofolio/${portfolio?.profile.username || username}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const getTrackTitle = (slug: string) =>
    TRACKS.find((t) => t.slug === slug)?.title ?? 'Analisis Data';

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="p-8 text-center">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Memuat portofolio @{username}...
          </p>
        </Card>
      </section>
    );
  }

  if (!portfolio) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="p-8 text-center sm:p-12">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-blue-700 dark:text-blue-400">
            404 · Portofolio Tidak Ditemukan
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-50">
            Profil @{username || '-'} belum tersedia
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Username ini belum terdaftar atau pemilik akun belum mengatur halaman portofolio publiknya.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/roadmap"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              Jelajahi Roadmap Belajar
            </Link>
            <Link
              to="/"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  const { profile, projects } = portfolio;
  const visibleProjects = isOwner ? projects : projects.filter((p) => p.isPublished);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      {/* Header Profil Portofolio */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-blue-200 bg-blue-50 font-display text-2xl font-bold text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(profile.fullName)
              )}
            </div>

            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
                  {profile.fullName}
                </h1>
                <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
                  @{profile.username}
                </span>
              </div>

              {(profile.tagline || profile.headline) && (
                <p className="max-w-2xl text-base font-medium text-slate-700 dark:text-slate-200">
                  {profile.tagline || profile.headline}
                </p>
              )}

              {profile.bio && (
                <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {profile.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-slate-600 dark:text-slate-300">
                {profile.city && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    <span>{profile.city}</span>
                  </span>
                )}
                {profile.targetRole && (
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    <span>{profile.targetRole}</span>
                  </span>
                )}
                {profile.githubUrl && (
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-slate-800 hover:text-blue-700 hover:underline dark:text-slate-200 dark:hover:text-blue-400"
                  >
                    <Github className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>GitHub</span>
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-slate-800 hover:text-blue-700 hover:underline dark:text-slate-200 dark:hover:text-blue-400"
                  >
                    <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>LinkedIn</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 lg:shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={() => void handleShare()}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  <span>Tautan Disalin</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  <span>Bagikan Profil</span>
                </>
              )}
            </Button>

            {isOwner && (
              <Link
                to="/proyek"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <FolderKanban className="h-4 w-4" aria-hidden="true" />
                <span>Kelola Proyek</span>
              </Link>
            )}
          </div>
        </div>

        {/* Skill Badges (Track yang 100% selesai) */}
        <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Kompetensi Track Terverifikasi
          </p>
          {skillBadges.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2.5">
              {skillBadges.map((skill) => (
                <span
                  key={skill.trackSlug}
                  title={skill.trackTitle}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>{skill.label} ✓</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Belum ada track kurikulum yang diselesaikan 100%.
            </p>
          )}
        </div>
      </Card>

      {/* Galeri Proyek */}
      <div className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">
              Galeri Studi Kasus Proyek
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Proyek analisis data dengan dokumentasi masalah, dataset, metode, dan rekomendasi.
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
            {visibleProjects.length} proyek
          </span>
        </div>

        {visibleProjects.length === 0 ? (
          <Card className="mt-6 p-10 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {isOwner
                ? 'Anda belum mempublikasikan proyek apa pun. Tambahkan atau publikasikan proyek pertama Anda sekarang.'
                : 'Pemilik portofolio belum mempublikasikan proyek untuk ditampilkan.'}
            </p>
            {isOwner && (
              <div className="mt-5">
                <Link
                  to="/proyek?new=1"
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 dark:bg-blue-600"
                >
                  Buat Proyek Pertama
                </Link>
              </div>
            )}
          </Card>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleProjects.map((project) => (
              <Card
                key={project.id}
                className="flex flex-col overflow-hidden transition-transform hover:-translate-y-0.5"
              >
                <div
                  className="flex h-32 flex-col justify-between p-5 text-white"
                  style={{ backgroundColor: project.thumbnailColor }}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-white/85">
                    <span>{getTrackTitle(project.trackSlug)}</span>
                    {!project.isPublished && (
                      <span className="rounded bg-black/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 font-display text-lg font-bold leading-snug text-white">
                    {project.title}
                  </p>
                </div>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <p className="line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {project.description}
                    </p>

                    {project.tags.length > 0 && (
                      <p className="mt-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {project.tags.slice(0, 5).join(' · ')}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <Link
                      to={`/portofolio/${profile.username}/${project.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400"
                    >
                      <span>Baca Studi Kasus</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
