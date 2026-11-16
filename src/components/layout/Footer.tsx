import { Link } from 'react-router-dom';
import { Moon, Sun, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function Footer() {
  const { theme, toggleTheme } = useTheme();

  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-2">
            <Link
              to="/"
              className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100"
            >
              DataPath
            </Link>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Platform belajar mandiri analisis data berbahasa Indonesia dari Excel dasar hingga big data, sekaligus arsip studi kasus portofolio.
            </p>
          </div>

          <div className="flex flex-wrap gap-10 text-sm">
            <div className="space-y-2.5">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Navigasi</p>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li>
                  <Link to="/#alur-belajar" className="hover:text-slate-900 dark:hover:text-slate-100">
                    Alur Belajar
                  </Link>
                </li>
                <li>
                  <Link to="/roadmap" className="hover:text-slate-900 dark:hover:text-slate-100">
                    Roadmap 8 Track
                  </Link>
                </li>
                <li>
                  <Link to="/#portofolio" className="hover:text-slate-900 dark:hover:text-slate-100">
                    Portofolio Proyek
                  </Link>
                </li>
                <li>
                  <Link to="/#faq" className="hover:text-slate-900 dark:hover:text-slate-100">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-slate-900 dark:hover:text-slate-100">
                    Dashboard Belajar
                  </Link>
                </li>
                <li>
                  <Link to="/masuk" className="hover:text-slate-900 dark:hover:text-slate-100">
                    Masuk / Daftar Akun
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Tampilan & Sumber</p>
              <div className="flex flex-col items-start gap-2.5">
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Ubah ke mode terang' : 'Ubah ke mode gelap'}
                  className="inline-flex min-h-11 sm:min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900 cursor-pointer"
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
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  <span>Repositori Portofolio</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DataPath. Disusun untuk pembelajaran analisis data mandiri.</p>
          <p>Bahasa Antarmuka: Bahasa Indonesia</p>
        </div>
      </div>
    </footer>
  );
}
