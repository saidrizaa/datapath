import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, KeyRound, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePageMeta } from '../lib/seo';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

type AuthTab = 'login' | 'register';
type LoginMethod = 'password' | 'magic_link';

export function AuthPage({ initialTab = 'login' }: { initialTab?: AuthTab }) {
  const {
    user,
    loading,
    isConfigured,
    signInWithPassword,
    signUpWithPassword,
    signInWithMagicLink,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');

  usePageMeta({
    title:
      tab === 'register'
        ? 'Daftar Akun Gratis | DataPath'
        : 'Masuk atau Daftar Akun | DataPath',
    description:
      'Masuk atau buat akun DataPath untuk menyinkronkan progres belajar, skor kuis, streak harian, dan portofolio studi kasus Anda.',
  });

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate(redirectPath, { replace: true });
    }
  }, [loading, user, navigate, redirectPath]);

  const switchTab = (next: AuthTab) => {
    setTab(next);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Alamat email wajib diisi.');
      return;
    }

    if (tab === 'login' && loginMethod === 'magic_link') {
      setSubmitting(true);
      const res = await signInWithMagicLink(trimmedEmail);
      setSubmitting(false);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage(
          res.message ?? 'Tautan masuk telah dikirim ke email Anda.'
        );
      }
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    if (tab === 'register') {
      if (!fullName.trim()) {
        setErrorMessage('Nama lengkap wajib diisi.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Konfirmasi kata sandi tidak cocok.');
        return;
      }
      setSubmitting(true);
      const res = await signUpWithPassword(trimmedEmail, password, fullName);
      setSubmitting(false);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage(
          res.message ?? 'Akun berhasil dibuat. Periksa email Anda untuk konfirmasi.'
        );
      }
      return;
    }

    setSubmitting(true);
    const res = await signInWithPassword(trimmedEmail, password);
    setSubmitting(false);
    if (res.error) {
      setErrorMessage(res.error);
    } else {
      navigate(redirectPath, { replace: true });
    }
  };

  return (
    <section className="mx-auto max-w-lg px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-6 space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
          Akun Pembelajar DataPath
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {tab === 'login' ? 'Masuk ke Akun Anda' : 'Daftar Akun Baru'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Simpan progres Track 1, skor kuis, dan streak harian Anda ke cloud Supabase.
        </p>
      </div>

      {!isConfigured && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <p className="font-semibold">Konfigurasi Supabase belum aktif</p>
          <p className="mt-1 text-xs leading-relaxed">
            Pastikan variabel <code className="font-mono">VITE_SUPABASE_URL</code> dan{' '}
            <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> sudah diisi di environment aplikasi. Sementara itu, Anda tetap bisa belajar di{' '}
            <Link to="/roadmap" className="font-semibold underline underline-offset-4">
              halaman Roadmap
            </Link>{' '}
            dengan penyimpanan browser (localStorage).
          </p>
        </div>
      )}

      <Card className="p-6 sm:p-8">
        {/* Tab Masuk / Daftar */}
        <div
          role="tablist"
          aria-label="Pilih mode autentikasi"
          className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'login'}
            onClick={() => switchTab('login')}
            className={`min-h-10 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
              tab === 'login'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'register'}
            onClick={() => switchTab('register')}
            className={`min-h-10 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
              tab === 'register'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            Daftar
          </button>
        </div>

        {/* Sub-pilihan metode masuk */}
        {tab === 'login' && (
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('password');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              aria-pressed={loginMethod === 'password'}
              className={`inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors cursor-pointer ${
                loginMethod === 'password'
                  ? 'border-blue-600 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-200'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Email & Kata Sandi</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('magic_link');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              aria-pressed={loginMethod === 'magic_link'}
              className={`inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors cursor-pointer ${
                loginMethod === 'magic_link'
                  ? 'border-blue-600 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-200'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Magic Link</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {tab === 'register' && (
            <div>
              <label
                htmlFor="auth-fullname"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Nama Lengkap
              </label>
              <input
                id="auth-fullname"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Misalnya: Rina Wijaya"
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Alamat Email
            </label>
            <div className="relative mt-1.5">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          {(tab === 'register' || loginMethod === 'password') && (
            <div>
              <label
                htmlFor="auth-password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Kata Sandi
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          )}

          {tab === 'register' && (
            <div>
              <label
                htmlFor="auth-confirm-password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Ulangi Kata Sandi
              </label>
              <input
                id="auth-confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi"
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          )}

          {tab === 'login' && loginMethod === 'magic_link' && (
            <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              Kami akan mengirimkan tautan sekali klik ke email Anda untuk masuk tanpa perlu mengingat kata sandi.
            </p>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{successMessage}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting || !isConfigured}
            className="w-full"
          >
            {submitting
              ? 'Memproses...'
              : tab === 'register'
                ? 'Buat Akun DataPath'
                : loginMethod === 'magic_link'
                  ? 'Kirim Magic Link ke Email'
                  : 'Masuk'}
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span>Ingin langsung mencoba materi tanpa login? </span>
          <Link to="/roadmap" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Buka Roadmap Track 1
          </Link>
        </div>
      </Card>
    </section>
  );
}
