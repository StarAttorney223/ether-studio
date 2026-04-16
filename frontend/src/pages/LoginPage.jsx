import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell";
import Toast from "../components/common/Toast";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const destination = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await login({ email, password });
      navigate(destination, { replace: true });
    } catch (error) {
      setToast({ message: error.message || "Unable to sign in.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthShell
        title="Welcome back"
        subtitle="Sign in to manage your studio, drafts, and profile."
        asideTitle="Content operations with a polished client-ready workflow."
        asideText="Your profile now travels with the rest of the product experience, from the navbar to your account page."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 w-full rounded-2xl bg-gray-100 px-4 text-sm text-gray-900 outline-none dark:bg-gray-700 dark:text-white"
              placeholder="you@studio.com"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 w-full rounded-2xl bg-gray-100 px-4 text-sm text-gray-900 outline-none dark:bg-gray-700 dark:text-white"
              placeholder="Enter your password"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-full bg-gradient-to-r from-[#6639ec] to-[#9a79ff] text-sm font-semibold text-white shadow-glow disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-300">
          New here?{" "}
          <Link to="/signup" className="font-semibold text-studio-primary">
            Create an account
          </Link>
        </p>
      </AuthShell>
      <Toast toast={toast} onClose={() => setToast({ message: "", type: "success" })} />
    </>
  );
}

export default LoginPage;
