import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <RouteLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) {
    return <RouteLoading />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-sm font-medium text-muted-foreground">
      Cargando...
    </div>
  );
}
