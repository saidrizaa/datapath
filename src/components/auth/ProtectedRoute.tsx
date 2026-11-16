import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="p-8 text-center">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Memeriksa sesi akun Anda...
          </p>
        </Card>
      </section>
    );
  }

  if (!user) {
    const target = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/masuk?redirect=${target}`} replace />;
  }

  return <>{children}</>;
}
