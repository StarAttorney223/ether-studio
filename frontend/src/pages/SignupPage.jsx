import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell";
import Toast from "../components/common/Toast";
import { useAuth } from "../context/AuthContext";

function SignupPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await register({ name, email, password });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setToast({ message: error.message || "Unable to create account.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthShell
        title="Create your account"
        subtitle="Start with a workspace identity that follows you across the product."
        asideTitle="Build a profile your team recognizes instantly."
        asideText="Sign up once, then personalize your name and avatar from the profile page without losing your workflow."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Display Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-12 w-full rounded-2xl bg-gray-100 px-4 text-sm text-gray-900 outline-none dark:bg-gray-700 dark:text-white"
              placeholder="Alex Rivers"
              required
            />
          </label>

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
              placeholder="Choose a secure password"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-full bg-gradient-to-r from-[#6639ec] to-[#9a79ff] text-sm font-semibold text-white shadow-glow disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-300">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-studio-primary">
            Sign in
          </Link>
        </p>
      </AuthShell>
      <Toast toast={toast} onClose={() => setToast({ message: "", type: "success" })} />
    </>
  );
}

export default SignupPage;
