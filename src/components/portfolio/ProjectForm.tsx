import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  AlertCircle,
  Check,
  Eye,
  FileEdit,
  Plus,
  RotateCcw,
  Save,
  X,
} from 'lucide-react';
import { TRACKS } from '../../data/curriculum';
import {
  DEFAULT_CASE_STUDY_TEMPLATE,
  PROJECT_THUMBNAIL_PALETTE,
  SUGGESTED_PROJECT_TAGS,
  isValidProjectSlug,
  resolveUniqueSlug,
  slugifyProjectTitle,
  validateProjectInput,
  type PortfolioProject,
  type ProjectFormInput,
} from '../../lib/portfolio';
import { SimpleMarkdown } from '../common/SimpleMarkdown';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface ProjectFormProps {
  initialProject?: PortfolioProject | null;
  defaultTrackSlug?: string;
  existingSlugs: string[];
  username?: string;
  onSave: (input: ProjectFormInput, existingId?: string) => Promise<void>;
  onCancel: () => void;
}

export function ProjectForm({
  initialProject,
  defaultTrackSlug,
  existingSlugs,
  username,
  onSave,
  onCancel,
}: ProjectFormProps) {
  const isEditing = Boolean(initialProject);

  const [title, setTitle] = useState(initialProject?.title ?? '');
  const [slug, setSlug] = useState(initialProject?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(initialProject));
  const [description, setDescription] = useState(initialProject?.description ?? '');
  const [caseStudy, setCaseStudy] = useState(
    initialProject?.caseStudy || DEFAULT_CASE_STUDY_TEMPLATE
  );
  const [tags, setTags] = useState<string[]>(
    initialProject?.tags.length ? initialProject.tags : ['Excel']
  );
  const [tagInput, setTagInput] = useState('');
  const [githubUrl, setGithubUrl] = useState(initialProject?.githubUrl ?? '');
  const [datasetUrl, setDatasetUrl] = useState(initialProject?.datasetUrl ?? '');
  const [trackSlug, setTrackSlug] = useState(
    initialProject?.trackSlug || defaultTrackSlug || TRACKS[0].slug
  );
  const [thumbnailColor, setThumbnailColor] = useState(
    initialProject?.thumbnailColor || PROJECT_THUMBNAIL_PALETTE[0].hex
  );
  const [isPublished, setIsPublished] = useState(initialProject?.isPublished ?? false);
  const [displayOrder, setDisplayOrder] = useState<number>(initialProject?.displayOrder ?? 0);

  const [mobilePreviewTab, setMobilePreviewTab] = useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!slugTouched && !isEditing) {
      setSlug(slugifyProjectTitle(title));
    }
  }, [title, slugTouched, isEditing]);

  const resolvedSlugPreview = resolveUniqueSlug(
    slug || title,
    existingSlugs,
    initialProject?.slug
  );

  const handleAddTag = (rawTag: string) => {
    const clean = rawTag.trim();
    if (!clean) return;
    if (tags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setTagInput('');
      return;
    }
    if (tags.length >= 10) {
      setErrorMessage('Maksimal 10 tag teknologi per proyek.');
      return;
    }
    setTags((prev) => [...prev, clean]);
    setTagInput('');
    setErrorMessage(null);
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleRemoveTag = (target: string) => {
    setTags((prev) => prev.filter((t) => t !== target));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const candidateSlug = (slug || slugifyProjectTitle(title)).trim();
    const payload: ProjectFormInput = {
      title: title.trim(),
      slug: candidateSlug,
      description: description.trim(),
      caseStudy,
      tags,
      githubUrl: githubUrl.trim(),
      datasetUrl: datasetUrl.trim(),
      trackSlug,
      thumbnailColor,
      isPublished,
      displayOrder: Number.isFinite(displayOrder) ? displayOrder : 0,
    };

    const validationError = validateProjectInput(payload);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSaving(true);
    try {
      await onSave(payload, initialProject?.id);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal menyimpan proyek.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">
            {isEditing ? 'Edit Proyek Portofolio' : 'Tambah Proyek Portofolio Baru'}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Susun studi kasus lengkap agar siap dibagikan ke rekruter melalui halaman portofolio publik Anda.
          </p>
        </div>

        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" aria-hidden="true" />
          <span>Batal</span>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Judul & Slug */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="project-title"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Judul Proyek <span className="text-rose-600">*</span>
              </label>
              <span className="font-mono text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
                {title.length}/100
              </span>
            </div>
            <input
              id="project-title"
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Dashboard Analisis Penjualan Toko Ritel"
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="project-slug"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Slug URL Proyek <span className="text-rose-600">*</span>
              </label>
              {slugTouched && !isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setSlugTouched(false);
                    setSlug(slugifyProjectTitle(title));
                  }}
                  className="text-[11px] font-medium text-blue-700 hover:underline dark:text-blue-400 cursor-pointer"
                >
                  Otomatis dari judul
                </button>
              )}
            </div>
            <input
              id="project-slug"
              type="text"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
              }}
              placeholder="dashboard-penjualan-toko-ritel"
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 font-mono text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              URL:{' '}
              <span className="font-mono text-slate-700 dark:text-slate-300">
                /portofolio/{username || 'username'}/{resolvedSlugPreview}
              </span>
              {slug && !isValidProjectSlug(slug) && (
                <span className="ml-2 text-rose-600 dark:text-rose-400">
                  (Gunakan huruf kecil, angka, dan tanda hubung)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Deskripsi Singkat */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="project-description"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Deskripsi Singkat (Kartu Galeri) <span className="text-rose-600">*</span>
            </label>
            <span className="font-mono text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
              {description.length}/200
            </span>
          </div>
          <textarea
            id="project-description"
            rows={2}
            required
            maxLength={200}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ringkas tujuan proyek dan dampak utamanya dalam 1–2 kalimat..."
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-3.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        {/* Track Terkait, Urutan, Status Publikasi */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label
              htmlFor="project-track"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Track Terkait
            </label>
            <select
              id="project-track"
              value={trackSlug}
              onChange={(e) => setTrackSlug(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {TRACKS.map((track) => (
                <option key={track.slug} value={track.slug}>
                  {String(track.order).padStart(2, '0')}. {track.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="project-order"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Urutan Tampil
            </label>
            <input
              id="project-order"
              type="number"
              min={0}
              max={999}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Warna Thumbnail & Status Publikasi */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div>
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Warna Thumbnail Kartu
            </span>
            <div className="mt-2 flex flex-wrap gap-2.5" role="radiogroup" aria-label="Pilih warna thumbnail proyek">
              {PROJECT_THUMBNAIL_PALETTE.map((option) => {
                const selected = thumbnailColor.toLowerCase() === option.hex.toLowerCase();
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={option.label}
                    title={option.label}
                    onClick={() => setThumbnailColor(option.hex)}
                    style={{ backgroundColor: option.hex }}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                      selected ? 'scale-105 ring-2 ring-slate-900 ring-offset-2 dark:ring-white dark:ring-offset-slate-950' : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    {selected && <Check className="h-4 w-4 text-white" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Status Publikasi
            </span>
            <div className="mt-2 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setIsPublished(false)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  !isPublished
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-50'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Draft (Privat)
              </button>
              <button
                type="button"
                onClick={() => setIsPublished(true)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  isPublished
                    ? 'bg-blue-700 text-white dark:bg-blue-600'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Dipublikasikan
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              {isPublished
                ? 'Proyek tampil di halaman portofolio publik dan membuka badge Portofolio Perdana (+50 XP).'
                : 'Draft hanya dapat dilihat oleh Anda di halaman Kelola Proyek.'}
            </p>
          </div>
        </div>

        {/* Tags Teknologi */}
        <div>
          <label
            htmlFor="project-tags-input"
            className="block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Tags Teknologi & Tools
          </label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <input
              id="project-tags-input"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Ketik tag lalu tekan Enter (misal: PivotTable)"
              className="h-10 min-w-[220px] flex-1 rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddTag(tagInput)}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Tambah Tag</span>
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    aria-label={`Hapus tag ${tag}`}
                    className="rounded hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Saran cepat:</span>
            {SUGGESTED_PROJECT_TAGS.filter(
              (s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase())
            ).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleAddTag(suggestion)}
                className="rounded border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 hover:border-blue-400 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-600 dark:hover:text-blue-300 cursor-pointer"
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Link GitHub & Dataset */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="project-github"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Link Repository GitHub (Opsional)
            </label>
            <input
              id="project-github"
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username/analisis-penjualan"
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="project-dataset"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Link Dataset / Demo Spreadsheet (Opsional)
            </label>
            <input
              id="project-dataset"
              type="url"
              value={datasetUrl}
              onChange={(e) => setDatasetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/..."
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Editor Studi Kasus Lengkap (Markdown Split Preview) */}
        <div className="space-y-3 border-t border-slate-200 pt-6 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <label
                htmlFor="project-case-study"
                className="block text-sm font-semibold text-slate-900 dark:text-slate-100"
              >
                Studi Kasus Lengkap (Markdown) <span className="text-rose-600">*</span>
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mendukung heading (`##`), daftar (`-`), kutipan (`&gt;`), tebal (`**teks**`), dan blok kode.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCaseStudy(DEFAULT_CASE_STUDY_TEMPLATE)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Gunakan Template 5 Bagian</span>
              </button>

              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 lg:hidden dark:border-slate-800 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setMobilePreviewTab('edit')}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer ${
                    mobilePreviewTab === 'edit'
                      ? 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <FileEdit className="h-3.5 w-3.5" aria-hidden="true" />
                  Tulis
                </button>
                <button
                  type="button"
                  onClick={() => setMobilePreviewTab('preview')}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer ${
                    mobilePreviewTab === 'preview'
                      ? 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  Pratinjau
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={mobilePreviewTab === 'preview' ? 'hidden lg:block' : 'block'}>
              <textarea
                id="project-case-study"
                required
                rows={16}
                value={caseStudy}
                onChange={(e) => setCaseStudy(e.target.value)}
                placeholder="Tulis studi kasus lengkap proyek Anda di sini..."
                className="w-full rounded-xl border border-slate-300 bg-white p-4 font-mono text-xs leading-relaxed text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div
              className={`min-h-[340px] rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50 ${
                mobilePreviewTab === 'edit' ? 'hidden lg:block' : 'block'
              }`}
            >
              <p className="mb-3 border-b border-slate-200 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                Pratinjau Studi Kasus
              </p>
              <SimpleMarkdown
                content={caseStudy}
                variant="article"
                emptyText="Mulai ketik Markdown di editor sebelah kiri untuk melihat pratinjau."
              />
            </div>
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            <span>
              {saving
                ? 'Menyimpan...'
                : isEditing
                  ? 'Simpan Perubahan Proyek'
                  : 'Simpan Proyek'}
            </span>
          </Button>
        </div>
      </form>
    </Card>
  );
}
