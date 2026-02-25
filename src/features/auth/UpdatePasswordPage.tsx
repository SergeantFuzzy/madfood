import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Loading } from "../../components/ui/Loading";
import { useAuth } from "./AuthContext";
import { updatePassword } from "./authService";

export const UpdatePasswordPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="container">
        <Loading label="Loading account..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (password !== confirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await updatePassword(password);
      setMessage("Password updated successfully.");
      setPassword("");
      setConfirm("");
    } catch (err) {
      const value = err as { message?: string };
      setError(value.message ?? "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Set new password</h1>
        <p className="page-subtitle">Choose a new password for your account.</p>
      </div>
      <Card className="max-w-520">
        <form className="stack" onSubmit={onSubmit}>
          <Input
            id="new-password"
            label="New password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
          />
          <Input
            id="confirm-password"
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
            minLength={6}
          />

          {error ? <p className="error-text">{error}</p> : null}
          {message ? <p className="help-text">{message}</p> : null}

          <div className="inline-row">
            <Button type="submit" loading={loading}>
              Update password
            </Button>
            <Link to="/settings" className="muted">
              Back to settings
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};
