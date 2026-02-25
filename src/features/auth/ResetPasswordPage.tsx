import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { sendPasswordReset } from "./authService";

export const ResetPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await sendPasswordReset(email);
      setMessage("Password reset email sent. Check your inbox.");
    } catch (err) {
      const value = err as { message?: string };
      setError(value.message ?? "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Reset password</h1>
        <p className="page-subtitle">Send yourself a secure password reset email.</p>
      </div>
      <Card className="max-w-520">
        <form className="stack" onSubmit={onSubmit}>
          <Input
            id="reset-email"
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          {error ? <p className="error-text">{error}</p> : null}
          {message ? <p className="help-text">{message}</p> : null}

          <div className="inline-row">
            <Button type="submit" loading={loading}>
              Send reset email
            </Button>
            <Link to="/login" className="muted">
              Back to login
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};
