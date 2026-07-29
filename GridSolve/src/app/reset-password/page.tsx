"use client";

// Landing page for the password-reset email link. By the time the user gets
// here the /auth/callback route has already exchanged the code for a session,
// so they're authenticated and can set a new password via updateUser().
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field, Message, SubmitButton } from "@/components/auth/fields";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return;
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => {
        router.replace("/explorer");
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't update your password. The reset link may have expired — request a new one."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a new password for your GridSolve account."
    >
      {done ? (
        <Message tone="notice">
          Password updated. Taking you to the explorer…
        </Message>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field
            label="New password"
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <Field
            label="Confirm password"
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading}
          />
          <Message tone="error">{error}</Message>
          <SubmitButton loading={loading}>
            {loading ? "Updating…" : "Update password"}
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
