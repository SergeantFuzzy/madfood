import { FormEvent, useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../auth/AuthContext";
import { signOut } from "../auth/authService";
import { getProfile, upsertProfile } from "./settingsService";

export const SettingsPage = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = await getProfile();
        if (!active) return;
        setDisplayName(profile?.display_name ?? "");
      } catch (err) {
        const value = err as { message?: string };
        if (active) setError(value.message ?? "Failed to load profile");
      } finally {
        if (active) setLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, []);

  const onSaveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      await upsertProfile({ display_name: displayName.trim() || null });
      setMessage("Profile saved.");
    } catch (err) {
      const value = err as { message?: string };
      setError(value.message ?? "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container stack">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage profile details and sign out.</p>
      </div>

      <Card className="max-w-620">
        <form className="stack" onSubmit={onSaveProfile}>
          <p className="muted">Signed in as: {user?.email ?? "Unknown"}</p>
          <Input
            id="display-name"
            label="Display name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="How your name appears in the app"
            disabled={loading}
          />

          {error ? <p className="error-text">{error}</p> : null}
          {message ? <p className="help-text">{message}</p> : null}

          <div className="inline-row">
            <Button type="submit" loading={saving} disabled={loading}>
              Save profile
            </Button>
            <Button type="button" variant="danger" onClick={signOut}>
              Log out
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
