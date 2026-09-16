"use client";

// Landing page for the password-reset email link. By the time the user gets
// here the /auth/callback route has already exchanged the code for a session,
// so they're authenticated and can set a new password via updateUser().
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatAuthError } from "@/lib/auth-errors";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { isPasswordStrong } from "@/lib/validation";
import { isPasswordPwned } from "@/lib/password-security";
import { AuthShell } from "@/components/auth/AuthShell";
import { Message, SubmitButton } from "@/components/auth/fields";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";

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
    if (!isPasswordStrong(password)) {
      setError("Please choose a password that meets all requirements.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (await isPasswordPwned(password)) {
        setError(
          "That password appears in a known data breach. Please choose a different one."
        );
        return;
      }
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => {
        router.replace("/explorer");
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(formatAuthError(err));
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
          <div>
            <PasswordField
              label="New password"
              id="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <PasswordRequirements password={password} checkBreaches />
          </div>
          <PasswordField
            label="Confirm password"
            id="confirm"
            autoComplete="new-password"
            required
            minLength={8}
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
