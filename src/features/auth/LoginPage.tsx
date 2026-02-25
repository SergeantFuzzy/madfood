import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { isSupabaseConfigured } from "../../lib/env";
import { InstallAppCard } from "../pwa/InstallAppCard";
import { useAuth } from "./AuthContext";
import { signInWithEmail, signUpWithEmail } from "./authService";

export const LoginPage = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
        setEmail("");
        setPassword("");
        setMessage("Account created. Check your email if confirmation is enabled.");
      }
    } catch (err) {
      const value = err as { message?: string };
      setError(value.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Welcome to MadFood</h1>
        <p className="page-subtitle">Meal planning, recipes, and shopping lists in one place.</p>
      </div>
      {!isSupabaseConfigured ? (
        <Card className="mb-1">
          <p className="error-text">Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` to use auth.</p>
        </Card>
      ) : null}
      <InstallAppCard className="mb-1" />
      <Card className="max-w-520">
        <form className="stack" onSubmit={onSubmit}>
          <div className="section-head mb-0">
            <h2>{mode === "login" ? "Log in" : "Create account"}</h2>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setMode((prev) => (prev === "login" ? "signup" : "login"))}
            >
              {mode === "login" ? "Need an account?" : "Have an account?"}
            </button>
          </div>

          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />

          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />

          {error ? <p className="error-text">{error}</p> : null}
          {message ? <p className="help-text">{message}</p> : null}

          <div className="inline-row">
            <Button type="submit" loading={loading}>
              {mode === "login" ? "Log in" : "Sign up"}
            </Button>
            <Link to="/reset-password" className="muted">
              Forgot password?
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};
