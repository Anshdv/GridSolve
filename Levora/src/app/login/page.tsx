"use client";

// Email + password auth: sign in, create account, and forgot-password, all in
// one screen with a mode toggle. Styled with the shared AuthShell so it reads
// as part of Levora. Falls back to a clear "not configured" state when the
// Supabase env vars aren't set, so the app never hard-crashes.
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field, Message, SubmitButton } from "@/components/auth/fields";

type Mode = "signin" | "signup" | "forgot";

const COPY: Record<Mode, { title: string; subtitle: string; cta: string }> = {
  signin: {
    title: "Sign in",
    subtitle: "Access the Levora interconnection explorer.",
    cta: "Sign in",
  },
  signup: {
    title: "Create your account",
    subtitle: "Sign up to explore interconnection capacity nationwide.",
    cta: "Create account",
  },
  forgot: {
    title: "Reset your password",
    subtitle: "We'll email you a link to set a new password.",
    cta: "Send reset link",
  },
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/explorer";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return;
    setLoading(true);
    setError("");
    setNotice("");
    const supabase = createClient();

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.replace(redirect);
        router.refresh();
        return; // keep the spinner up during navigation
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
              redirect
            )}`,
          },
        });
        if (error) throw error;
        // If email confirmation is disabled, a session comes back immediately.
        if (data.session) {
          router.replace(redirect);
          router.refresh();
          return;
        }
        setNotice(
          `Almost there — we sent a confirmation link to ${email}. Click it to activate your account, then sign in.`
        );
      }

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        if (error) throw error;
        setNotice(
          `If an account exists for ${email}, a password-reset link is on its way.`
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const copy = COPY[mode];

  return (
    <AuthShell
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        mode === "signin" ? (
          <>
            New to Levora?{" "}
            <button
              onClick={() => switchMode("signup")}
              className="font-medium text-[var(--accent-bright)] transition-colors hover:text-white"
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              onClick={() => switchMode("signin")}
              className="font-medium text-[var(--accent-bright)] transition-colors hover:text-white"
            >
              Sign in
            </button>
          </>
        )
      }
    >
      {!isSupabaseConfigured && (
        <div className="mb-5">
          <Message tone="error">
            Authentication isn&apos;t configured yet. Add your{" "}
            <span className="font-tele">NEXT_PUBLIC_SUPABASE_URL</span> and{" "}
            <span className="font-tele">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> to{" "}
            <span className="font-tele">.env.local</span> and restart the dev
            server.
          </Message>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || !isSupabaseConfigured}
        />

        {mode !== "forgot" && (
          <div>
            <Field
              label="Password"
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || !isSupabaseConfigured}
            />
            {mode === "signin" && (
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="mt-2 text-xs text-neutral-500 transition-colors hover:text-neutral-300"
              >
                Forgot password?
              </button>
            )}
            {mode === "signup" && (
              <p className="mt-2 text-xs text-neutral-600">
                At least 6 characters.
              </p>
            )}
          </div>
        )}

        <Message tone="error">{error}</Message>
        <Message tone="notice">{notice}</Message>

        <SubmitButton loading={loading} disabled={!isSupabaseConfigured}>
          {loading ? "Working…" : copy.cta}
        </SubmitButton>

        {mode === "forgot" && (
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className="w-full text-center text-xs text-neutral-500 transition-colors hover:text-neutral-300"
          >
            ← Back to sign in
          </button>
        )}
      </form>

      <p className="mt-6 border-t border-white/[0.06] pt-4 text-center text-[11px] leading-relaxed text-neutral-600">
        The homepage and{" "}
        <Link href="/methodology" className="underline decoration-dotted hover:text-neutral-400">
          methodology
        </Link>{" "}
        stay open. Sign in is only needed for the explorer.
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthShell title="Sign in">Loading…</AuthShell>}>
      <LoginForm />
    </Suspense>
  );
}
