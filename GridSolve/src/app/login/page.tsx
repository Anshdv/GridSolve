"use client";

// Sign in and forgot-password. New accounts are created at /signup.
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatAuthError } from "@/lib/auth-errors";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field, Message, SubmitButton } from "@/components/auth/fields";
import { PasswordField } from "@/components/auth/PasswordField";

type Mode = "signin" | "forgot";

const COPY: Record<Mode, { title: string; subtitle: string; cta: string }> = {
  signin: {
    title: "Sign in",
    subtitle: "Access the GridSolve interconnection explorer.",
    cta: "Sign in",
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

  const signupHref =
    redirect !== "/explorer"
      ? `/signup?redirect=${encodeURIComponent(redirect)}`
      : "/signup";

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
          email: email.trim(),
          password,
        });
        if (error) throw error;
        router.replace(redirect);
        router.refresh();
        return;
      }

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        if (error) throw error;
        setNotice(
          `If an account exists for ${email.trim()}, a password-reset link is on its way.`
        );
      }
    } catch (err) {
      setError(formatAuthError(err));
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
            New to GridSolve?{" "}
            <Link
              href={signupHref}
              className="font-medium text-[var(--accent-bright)] transition-colors hover:text-white"
            >
              Create an account
            </Link>
          </>
        ) : (
          <>
            Remember your password?{" "}
            <button
              type="button"
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
          placeholder="you@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || !isSupabaseConfigured}
        />

        {mode === "signin" && (
          <div>
            <PasswordField
              label="Password"
              id="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || !isSupabaseConfigured}
            />
            <button
              type="button"
              onClick={() => switchMode("forgot")}
              className="mt-2 text-xs text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Forgot password?
            </button>
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
        stay open without an account.
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
