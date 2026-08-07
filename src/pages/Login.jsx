import { useState } from "react";
import { useAuth } from "../hooks/useAuth.js";
import TextInput from "../components/TextInput.jsx";
import Button from "../components/Button.jsx";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = login(username, password);
    if (!result.success) {
      setError(result.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-primary-300/30 blur-3xl" />

      <div className="relative w-full max-w-sm rounded-2xl border border-white/60 bg-white/70 p-8 shadow-card backdrop-blur-xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl text-white shadow-soft">
            🛠️
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            Admin Sign In
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Maintenance AI Assistant dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <TextInput
            id="username"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            required
            autoFocus
          />
          <TextInput
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <a href="#" className="text-primary-600 hover:underline">
            Forgot Password?
          </a>
        </div>

        <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <p className="font-medium text-slate-600">Demo account</p>
          <p>admin / admin123</p>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Looking to submit a work request instead?{" "}
          <a href="#/" className="text-primary-600 hover:underline">
            Go back
          </a>
        </p>
      </div>
    </div>
  );
}
