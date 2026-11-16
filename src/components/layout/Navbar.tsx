import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, LogOut } from 'lucide-react';
import { Button } from "../ui/button";
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

function getInitials(name?: string, email?: string): string {
  const source = (name || email || 'DP').trim();
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, profile, streak, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = user
    ? [
        { label: 'Roadmap', type: 'route' as const, target: '/roadmap' },
        { label: 'Dashboard', type: 'route' as const, target: '/dashboard' },
        { label: 'Proyek', type: 'route' as const, target: '/proyek' },
        { label: 'Catatan', type: 'route' as const, target: '/catatan' },
        { label: 'Pencapaian', type: 'route' as const, target: '/pencapaian' },
        { label: 'Profil', type: 'route' as const, target: '/profil' },
      ]
    : [
        { label: 'Roadmap', type: 'route' as const, target: '/roadmap' },
        { label: 'Dashboard', type: 'route' as const, target: '/dashboard' },
        { label: 'Catatan', type: 'route' as const, target: '/catatan' },
        { label: 'Pencapaian', type: 'route' as const, target: '/pencapaian' },
        { label: 'Masuk', type: 'route' as const, target: '/masuk' },
      ];

  const handleHashNav = (hash: string) => {
    setMobileOpen(false);
    if (location.pathname !== '/') {
      navigate('/' + hash);
      setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
      return;
    }
    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
  };

  const initials = getInitials(profile?.fullName, user?.email);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Zona 1: Wordmark tunggal */}
        <Link
          to="/"
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 dark:text-slate-100"
        >
          DataPath
        </Link>

        {/* Zona 2: Tautan navigasi satu baris */}
        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          {navItems.map((item) =>
            item.type === 'route' ? (
              <Link
                key={item.target}
                to={item.target}
                className={`whitespace-nowrap shrink-0 underline-offset-4 hover:text-slate-900 hover:underline dark:hover:text-white transition-colors ${
                  location.pathname === item.target
                    ? 'font-semibold text-blue-700 dark:text-blue-400'
                    : ''
                }`}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.target}
                href={item.target}
                onClick={(e) => {
                  e.preventDefault();
                  handleHashNav(item.target);
                }}
                className="whitespace-nowrap shrink-0 underline-offset-4 hover:text-slate-900 hover:underline dark:hover:text-white transition-colors"
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        {/* Zona 3: Streak + Avatar/Profil + Aksi utama + menu mobile */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/pencapaian"
            aria-label={`Streak belajar harian: ${streak.currentStreak} hari`}
            title={`Streak ${streak.currentStreak} hari (Rekor: ${streak.longestStreak} hari)`}
            className="inline-flex min-h-11 sm:min-h-9 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/80 px-3 sm:px-2.5 font-mono text-xs font-semibold text-amber-800 tabular-nums transition-colors hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70"
          >
            <span aria-hidden="true">🔥</span>
            <span>{streak.currentStreak}</span>
          </Link>

          <Link
            to="/profil"
            aria-label="Buka halaman profil pembelajar"
            title={profile?.fullName || 'Profil Pembelajar'}
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-blue-50 font-display text-xs font-bold text-blue-800 transition-colors hover:border-blue-400 dark:border-slate-700 dark:bg-blue-950/60 dark:text-blue-200"
          >
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName || 'Avatar profil'}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </Link>

          <Button
            size="sm"
            onClick={() => navigate(user ? '/dashboard' : '/roadmap')}
            className="hidden lg:inline-flex"
          >
            {user ? 'Lanjut Belajar' : 'Mulai Belajar'}
          </Button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Menu mobile responsif */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 md:hidden">
          <nav aria-label="Navigasi mobile" className="flex flex-col gap-1">
            {navItems.map((item) =>
              item.type === 'route' ? (
                <Link
                  key={item.target}
                  to={item.target}
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.target}
                  href={item.target}
                  onClick={(e) => {
                    e.preventDefault();
                    handleHashNav(item.target);
                  }}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {item.label}
                </a>
              )
            )}
            <Link
              to="/profil"
              onClick={() => setMobileOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Profil Saya
            </Link>
          </nav>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4" aria-hidden="true" />
                  <span>Mode Terang</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" aria-hidden="true" />
                  <span>Mode Gelap</span>
                </>
              )}
            </button>

            {user ? (
              <Button
                variant="outline"
                onClick={() => {
                  setMobileOpen(false);
                  void signOut();
                }}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Keluar</span>
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setMobileOpen(false);
                  navigate('/roadmap');
                }}
              >
                Mulai Belajar
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
