import { FormEvent, useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../auth/AuthContext";
import { signOut } from "../auth/authService";
import { InstallAppCard } from "../pwa/InstallAppCard";
import { buildWeeklyReminderPreview, getProfile, sendWeeklyReminderText, upsertProfile } from "./settingsService";

export const SettingsPage = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [textRemindersEnabled, setTextRemindersEnabled] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderPreview, setReminderPreview] = useState<string | null>(null);
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
        setPhoneNumber(profile?.phone_number ?? "");
        setTextRemindersEnabled(profile?.text_reminders_enabled ?? false);
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
      await upsertProfile({
        display_name: displayName.trim() || null,
        phone_number: phoneNumber.trim() || null,
        text_reminders_enabled: textRemindersEnabled
      });
      setMessage("Profile saved.");
    } catch (err) {
      const value = err as { message?: string };
      setError(value.message ?? "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const onPreviewReminder = async () => {
    setSendingReminder(true);
    setError(null);
    setMessage(null);
    try {
      const preview = await buildWeeklyReminderPreview();
      setReminderPreview(preview.message);
    } catch (err) {
      const value = err as { message?: string };
      setError(value.message ?? "Failed to generate reminder preview");
    } finally {
      setSendingReminder(false);
    }
  };

  const onSendReminder = async () => {
    setSendingReminder(true);
    setError(null);
    setMessage(null);
    try {
      const result = await sendWeeklyReminderText();
      setReminderPreview(result.message);
      setMessage("Text reminder sent.");
    } catch (err) {
      const value = err as { message?: string };
      setError(value.message ?? "Failed to send text reminder");
    } finally {
      setSendingReminder(false);
    }
  };

  return (
    <div className="container stack">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage profile details and sign out.</p>
      </div>

      <InstallAppCard />

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

          <Input
            id="phone-number"
            label="Phone number (for text reminders)"
            type="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="+15551234567"
            disabled={loading}
          />

          <label className="inline-row">
            <input
              type="checkbox"
              checked={textRemindersEnabled}
              onChange={(event) => setTextRemindersEnabled(event.target.checked)}
              disabled={loading}
            />
            <span className="help-text">Enable text reminders</span>
          </label>

          <div className="inline-row">
            <Button type="button" variant="secondary" onClick={onPreviewReminder} loading={sendingReminder} disabled={loading}>
              Preview reminder
            </Button>
            <Button type="button" variant="secondary" onClick={onSendReminder} loading={sendingReminder} disabled={loading}>
              Send reminder text
            </Button>
          </div>

          {reminderPreview ? <pre className="text-reminder-preview">{reminderPreview}</pre> : null}

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
