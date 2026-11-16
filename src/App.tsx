import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { BadgeUnlockToast } from './components/gamification/BadgeUnlockToast';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const HomePage = lazy(() =>
  import('./pages/HomePage').then((m) => ({ default: m.HomePage }))
);
const RoadmapPage = lazy(() =>
  import('./pages/RoadmapPage').then((m) => ({ default: m.RoadmapPage }))
);
const TrackPreviewPage = lazy(() =>
  import('./pages/TrackPreviewPage').then((m) => ({ default: m.TrackPreviewPage }))
);
const LessonPage = lazy(() =>
  import('./pages/LessonPage').then((m) => ({ default: m.LessonPage }))
);
const AuthPage = lazy(() =>
  import('./pages/AuthPage').then((m) => ({ default: m.AuthPage }))
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const NotesPage = lazy(() =>
  import('./pages/NotesPage').then((m) => ({ default: m.NotesPage }))
);
const AchievementsPage = lazy(() =>
  import('./pages/AchievementsPage').then((m) => ({ default: m.AchievementsPage }))
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const ProjectsManagePage = lazy(() =>
  import('./pages/ProjectsManagePage').then((m) => ({ default: m.ProjectsManagePage }))
);
const PublicPortfolioPage = lazy(() =>
  import('./pages/PublicPortfolioPage').then((m) => ({ default: m.PublicPortfolioPage }))
);
const CaseStudyPage = lazy(() =>
  import('./pages/CaseStudyPage').then((m) => ({ default: m.CaseStudyPage }))
);

function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex min-h-[50vh] max-w-6xl items-center justify-center px-4 py-16 text-sm font-medium text-slate-600 dark:text-slate-300"
    >
      Memuat halaman...
    </div>
  );
}

function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollManager />
          <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-blue-700 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
            >
              Lewati ke konten utama
            </a>
            <Navbar />
            <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/roadmap" element={<RoadmapPage />} />
                  <Route path="/roadmap/:slug" element={<TrackPreviewPage />} />
                  <Route path="/belajar/excel/:lessonSlug" element={<LessonPage />} />
                  <Route path="/masuk" element={<AuthPage />} />
                  <Route path="/login" element={<AuthPage />} />
                  <Route path="/daftar" element={<AuthPage initialTab="register" />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/catatan" element={<NotesPage />} />
                  <Route path="/pencapaian" element={<AchievementsPage />} />
                  <Route path="/profil" element={<ProfilePage />} />
                  <Route
                    path="/proyek"
                    element={
                      <ProtectedRoute>
                        <ProjectsManagePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/portofolio/:username" element={<PublicPortfolioPage />} />
                  <Route path="/portofolio/:username/:projectSlug" element={<CaseStudyPage />} />
                  <Route path="*" element={<HomePage />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
            <BadgeUnlockToast />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
