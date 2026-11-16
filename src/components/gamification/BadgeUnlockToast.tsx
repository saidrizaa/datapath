import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Award, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function BadgeUnlockToast() {
  const { badgeToastQueue, dismissBadgeToast } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const activeToast = badgeToastQueue[0] ?? null;

  useEffect(() => {
    if (!activeToast) return;
    const timer = window.setTimeout(() => {
      dismissBadgeToast(activeToast.id);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [activeToast, dismissBadgeToast]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
    >
      <AnimatePresence>
        {activeToast && (
          <motion.div
            key={activeToast.id}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
            role="status"
            className="pointer-events-auto rounded-xl border border-blue-200 bg-white p-4 shadow-lg dark:border-blue-800 dark:bg-slate-900"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                <Award className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                  Pencapaian Baru Terbuka
                </p>
                <p className="mt-0.5 font-display text-sm font-bold text-slate-900 dark:text-slate-50">
                  {activeToast.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                  {activeToast.description}
                </p>
                <Link
                  to="/pencapaian"
                  onClick={() => dismissBadgeToast(activeToast.id)}
                  className="mt-2 inline-block text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
                >
                  Lihat Semua Pencapaian
                </Link>
              </div>

              <button
                type="button"
                onClick={() => dismissBadgeToast(activeToast.id)}
                aria-label="Tutup notifikasi pencapaian"
                className="inline-flex min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
