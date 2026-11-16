import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Database,
  ExternalLink,
  Github,
  Pencil,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TRACKS } from '../data/curriculum';
import { usePageMeta } from '../lib/seo';
import { getAdjacentProjects, type PublicPortfolioData } from '../lib/portfolio';
import { fetchPublicPortfolioByUsername } from '../services/portfolioService';
import { SimpleMarkdown } from '../components/common/SimpleMarkdown';
import { Card } from '../components/ui/card';

function formatDateId(iso: string): string {
  const ts = Date.parse(iso);
  if (!ts) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(ts));
}

export function CaseStudyPage() {
  const { username = '', projectSlug = '' } = useParams<{
    username: string;
    projectSlug: string;
  }>();
  const { user, profile: viewerProfile } = useAuth();

  const [portfolio, setPortfolio] = useState<PublicPortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const isOwner = Boolean(
    portfolio &&
      ((user && user.id === portfolio.profile.id) ||
        (!user &&
          viewerProfile?.username &&
          viewerProfile.username.toLowerCase() === portfolio.profile.username.toLowerCase()))
  );

  const project = useMemo(() => {
    if (!portfolio) return null;
    const found = portfolio.projects.find((p) => p.slug === projectSlug);
    if (!found) return null;
    if (!found.isPublished && !isOwner) return null;
    return found;
  }, [portfolio, projectSlug, isOwner]);

  const { prev, next } = useMemo(() => {
    if (!portfolio || !project) return { prev: null, next: null };
    return getAdjacentProjects(portfolio.projects, project.slug);
  }, [portfolio, project]);

  usePageMeta({
    title:
      project && portfolio
        ? `${project.title} | Portofolio ${portfolio.profile.fullName} | DataPath`
        : 'Studi Kasus Tidak Ditemukan — DataPath',
    description:
      project?.description ||
      'Studi kasus proyek analisis data di portofolio pembelajar DataPath.',
    ogType: 'article',
  });

  const getTrackTitle = (slug: string) =>
    TRACKS.find((t) => t.slug === slug)?.title ?? 'Analisis Data';

  if (loading) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="p-8 text-center">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Memuat studi kasus proyek...
          </p>
        </Card>
      </section>
    );
  }

  if (!portfolio || !project) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="p-8 text-center sm:p-12">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-blue-700 dark:text-blue-400">
            404 · Studi Kasus Tidak Ditemukan
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-slate-50">
            Proyek tidak tersedia
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-600 dark:text-slate-300">
            Studi kasus yang Anda cari mungkin masih berstatus Draft atau tautannya telah berubah.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={portfolio ? `/portofolio/${portfolio.profile.username}` : '/roadmap'}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 dark:bg-blue-600"
            >
              {portfolio ? 'Kembali ke Portofolio' : 'Lihat Roadmap'}
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  const { profile } = portfolio;

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      {/* Bar Navigasi Atas */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          to={`/portofolio/${profile.username}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Kembali ke Portofolio</span>
        </Link>

        {isOwner && (
          <Link
            to={`/proyek?edit=${project.id}`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Edit Proyek</span>
          </Link>
        )}
      </div>

      {/* Header Studi Kasus */}
      <Card className="overflow-hidden">
        <div
          className="h-3 w-full"
          style={{ backgroundColor: project.thumbnailColor }}
          aria-hidden="true"
        />
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-blue-700 dark:text-blue-400">
              {getTrackTitle(project.trackSlug)}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{formatDateId(project.updatedAt || project.createdAt)}</span>
            </span>
            {!project.isPublished && (
              <>
                <span>·</span>
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  Draft (Privat)
                </span>
              </>
            )}
          </div>

          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
            {project.title}
          </h1>

          <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">
            {project.description}
          </p>

          {project.tags.length > 0 && (
            <p className="mt-4 font-mono text-xs text-slate-500 dark:text-slate-400">
              Tools: {project.tags.join(' · ')}
            </p>
          )}

          {(project.githubUrl || project.datasetUrl) && (
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <Github className="h-4 w-4" aria-hidden="true" />
                  <span>Lihat Kode di GitHub</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                </a>
              )}
              {project.datasetUrl && (
                <a
                  href={project.datasetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <Database className="h-4 w-4" aria-hidden="true" />
                  <span>Akses Dataset / Sumber</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                </a>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Isi Artikel Studi Kasus (Markdown) */}
      <Card className="mt-6 p-6 sm:p-10">
        <SimpleMarkdown content={project.caseStudy} variant="article" />
      </Card>

      {/* Kartu Penulis */}
      <Card className="mt-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Disusun oleh
          </p>
          <p className="mt-0.5 font-display text-base font-bold text-slate-900 dark:text-slate-50">
            {profile.fullName}{' '}
            <span className="font-mono text-xs font-normal text-slate-500 dark:text-slate-400">
              @{profile.username}
            </span>
          </p>
          {(profile.tagline || profile.headline) && (
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              {profile.tagline || profile.headline}
            </p>
          )}
        </div>
        <Link
          to={`/portofolio/${profile.username}`}
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          Semua Proyek {profile.fullName.split(' ')[0]}
        </Link>
      </Card>

      {/* Navigasi Proyek Sebelumnya / Berikutnya */}
      {(prev || next) && (
        <nav
          aria-label="Navigasi antar proyek"
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div>
            {prev && (
              <Link
                to={`/portofolio/${profile.username}/${prev.slug}`}
                className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-600"
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Proyek Sebelumnya
                </span>
                <span className="mt-1.5 font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                  {prev.title}
                </span>
              </Link>
            )}
          </div>
          <div>
            {next && (
              <Link
                to={`/portofolio/${profile.username}/${next.slug}`}
                className="flex h-full flex-col items-end justify-between rounded-xl border border-slate-200 bg-white p-4 text-right transition-colors hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-600"
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Proyek Berikutnya
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="mt-1.5 font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                  {next.title}
                </span>
              </Link>
            )}
          </div>
        </nav>
      )}
    </article>
  );
}
