import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  /** If provided, only users with this role can access the route */
  role?: "ADMIN" | "MEMBER";
}

/**
 * Wraps protected routes.
 * - Shows nothing while auth is loading (avoids flash-redirect on refresh)
 * - Redirects to "/" if not authenticated
 * - Redirects to the correct dashboard if the user's role doesn't match
 */
export function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    // Avoid premature redirect while rehydrating from localStorage
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Role mismatch — send to the user's own dashboard
  if (role && user?.role !== role) {
    return <Navigate to={user?.role === "ADMIN" ? "/admin" : "/member"} replace />;
  }

  return <Outlet />;
}
