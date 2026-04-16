import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function AuthGate({ requireAuth }) {
  const location = useLocation();
  const { authLoading, isAuthenticated } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-studio-bg p-6">
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-8 shadow-soft">
          <div className="h-8 w-56 animate-pulse rounded-xl bg-slate-200" />
          <div className="mt-4 h-4 w-72 animate-pulse rounded-xl bg-slate-200" />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="h-56 animate-pulse rounded-[1.8rem] bg-slate-200" />
            <div className="h-56 animate-pulse rounded-[1.8rem] bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default AuthGate;
