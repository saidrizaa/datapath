import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  FolderPlus,
  Pencil,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TRACKS } from '../data/curriculum';
import { usePageMeta } from '../lib/seo';
import type { PortfolioProject, ProjectFormInput } from '../lib/portfolio';
import {
  deleteUserProject,
  fetchUserProjects,
  saveUserProject,
  toggleUserProjectPublish,
} from '../services/portfolioService';
import { ProjectForm } from '../components/portfolio/ProjectForm';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

export function ProjectsManagePage() {
  const { user, profile, storageMode } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  usePageMeta({
    title: 'Kelola Proyek Portofolio — DataPath',
    description:
      'Tambah, edit, dan publikasikan studi kasus proyek analisis data Anda ke halaman portofolio publik DataPath.',
    noIndex: true,
  });

  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [formMode, setFormMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [defaultTrackSlug, setDefaultTrackSlug] = useState<string | undefined>(undefined);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    setErrorNotice(null);
    try {
      const res = await fetchUserProjects(user?.id);
      setProjects(res.projects);
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Gagal memuat daftar proyek.');
    } finally {
      setLoadingProjects(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  // Tangani query params ?edit=<id> atau ?new=1&track=<slug>
  useEffect(() => {
    if (loadingProjects) return;
    const editId = searchParams.get('edit');
    const isNew = searchParams.get('new');
    const trackParam = searchParams.get('track');

    if (editId) {
      const found = projects.find((p) => p.id === editId);
      if (found) {
        setEditingProject(found);
        setFormMode('edit');
      }
      return;
    }

    if (isNew === '1') {
      setEditingProject(null);
      setDefaultTrackSlug(trackParam || undefined);
      setFormMode('create');
    }
  }, [loadingProjects, projects, searchParams]);

  const clearQueryParams = () => {
    if (searchParams.has('edit') || searchParams.has('new') || searchParams.has('track')) {
      setSearchParams({}, { replace: true });
    }
  };

  const handleOpenCreate = () => {
    setEditingProject(null);
    setDefaultTrackSlug(undefined);
    setFormMode('create');
    setStatusNotice(null);
    setErrorNotice(null);
  };

  const handleOpenEdit = (project: PortfolioProject) => {
    setEditingProject(project);
    setFormMode('edit');
    setStatusNotice(null);
    setErrorNotice(null);
  };

  const handleCancelForm = () => {
    setFormMode('list');
    setEditingProject(null);
    clearQueryParams();
  };

  const handleSaveProject = async (input: ProjectFormInput, existingId?: string) => {
    const res = await saveUserProject(input, user?.id, existingId);
    setProjects((prev) => {
      if (existingId) {
        return prev.map((p) => (p.id === existingId ? res.project : p));
      }
      return [res.project, ...prev];
    });
    setFormMode('list');
    setEditingProject(null);
    clearQueryParams();
    setStatusNotice(
      existingId
        ? `Proyek "${res.project.title}" berhasil diperbarui.`
        : `Proyek "${res.project.title}" berhasil ditambahkan.`
    );
    await loadProjects();
  };

  const handleTogglePublish = async (project: PortfolioProject) => {
    setErrorNotice(null);
    setStatusNotice(null);
    try {
      const updated = await toggleUserProjectPublish(project.id, !project.isPublished, user?.id);
      if (updated) {
        setProjects((prev) => prev.map((p) => (p.id === project.id ? updated : p)));
        setStatusNotice(
          updated.isPublished
            ? `Proyek "${updated.title}" sekarang dipublikasikan ke portofolio.`
            : `Proyek "${updated.title}" dikembalikan ke Draft.`
        );
      }
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Gagal mengubah status publikasi.');
    }
  };

  const handleDeleteProject = async (project: PortfolioProject) => {
    setErrorNotice(null);
    setStatusNotice(null);
    try {
      await deleteUserProject(project.id, user?.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      setConfirmDeleteId(null);
      setStatusNotice(`Proyek "${project.title}" berhasil dihapus.`);
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Gagal menghapus proyek.');
    }
  };

  const getTrackTitle = (slug: string) =>
    TRACKS.find((t) => t.slug === slug)?.title ?? 'Analisis Data';

  const username = profile?.username?.trim() || '';
  const publishedCount = projects.filter((p) => p.isPublished).length;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Kembali ke Dashboard</span>
        </Link>

        {username && (
          <Link
            to={`/portofolio/${username}`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <span>Lihat Portofolio Publik</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            Portofolio & Studi Kasus
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Kelola Proyek Saya
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
            {publishedCount} dipublikasikan · {projects.length} total proyek ({storageMode === 'supabase' ? 'tersinkron ke Supabase' : 'penyimpanan lokal'}).
          </p>
        </div>

        {formMode === 'list' && (
          <Button onClick={handleOpenCreate}>
            <FolderPlus className="h-4 w-4" aria-hidden="true" />
            <span>Tambah Proyek Baru</span>
          </Button>
        )}
      </div>

      {/* Peringatan bila username portofolio publik belum diatur */}
      {!username && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="flex items-start gap-2.5">
            <UserCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="text-xs leading-relaxed">
              Atur <strong>username portofolio publik</strong> Anda terlebih dahulu di halaman Profil agar tautan{' '}
              <span className="font-mono">/portofolio/username</span> dapat dibagikan ke rekruter.
            </p>
          </div>
          <Link
            to="/profil"
            className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg bg-amber-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500"
          >
            Atur Username Sekarang
          </Link>
        </div>
      )}

      {statusNotice && (
        <div
          role="status"
          className="mt-6 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{statusNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div
          role="alert"
          className="mt-6 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorNotice}</span>
        </div>
      )}

      <div className="mt-8">
        {formMode !== 'list' ? (
          <ProjectForm
            initialProject={editingProject}
            defaultTrackSlug={defaultTrackSlug}
            existingSlugs={projects.map((p) => p.slug)}
            username={username}
            onSave={handleSaveProject}
            onCancel={handleCancelForm}
          />
        ) : loadingProjects ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">Memuat daftar proyek Anda...</p>
          </Card>
        ) : projects.length === 0 ? (
          <Card className="p-10 text-center">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-50">
              Belum ada proyek portofolio
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
              Dokumentasikan proyek Excel, SQL, atau Python Anda menjadi studi kasus terstruktur lengkap dengan latar belakang, metode, dan temuan utama.
            </p>
            <div className="mt-6">
              <Button onClick={handleOpenCreate}>
                <FolderPlus className="h-4 w-4" aria-hidden="true" />
                <span>Tambah Proyek Pertama</span>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {projects.map((project) => {
              const isConfirmingDelete = confirmDeleteId === project.id;
              return (
                <Card key={project.id} className="overflow-hidden">
                  <div
                    className="h-2.5 w-full"
                    style={{ backgroundColor: project.thumbnailColor }}
                    aria-hidden="true"
                  />
                  <div className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-blue-700 dark:text-blue-400">
                        {getTrackTitle(project.trackSlug)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          project.isPublished
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {project.isPublished ? (
                          <>
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Dipublikasikan</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Draft</span>
                          </>
                        )}
                      </span>
                    </div>

                    <h2 className="mt-2 font-display text-lg font-bold text-slate-900 dark:text-slate-50">
                      {project.title}
                    </h2>
                    <p className="mt-1.5 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                      {project.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      <span>/{project.slug}</span>
                      <span>·</span>
                      <span>Urutan #{project.displayOrder}</span>
                      {project.tags.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{project.tags.slice(0, 4).join(', ')}</span>
                        </>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(project)}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Edit</span>
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleTogglePublish(project)}
                        >
                          {project.isPublished ? (
                            <>
                              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Jadikan Draft</span>
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Publikasikan</span>
                            </>
                          )}
                        </Button>

                        {username && (
                          <Link
                            to={`/portofolio/${username}/${project.slug}`}
                            className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                          >
                            <span>Buka</span>
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        )}
                      </div>

                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleDeleteProject(project)}
                            className="inline-flex min-h-9 items-center rounded-lg bg-rose-700 px-3 text-xs font-semibold text-white hover:bg-rose-800 cursor-pointer"
                          >
                            Konfirmasi Hapus
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="inline-flex min-h-9 items-center rounded-lg border border-slate-300 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(project.id)}
                          aria-label={`Hapus proyek ${project.title}`}
                          className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
