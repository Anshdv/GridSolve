"use client";

// Sign in, email OTP, TOTP MFA, and forgot-password.
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field, Message, SubmitButton } from "@/components/auth/fields";
import { PasswordField } from "@/components/auth/PasswordField";

type Mode = "signin" | "forgot" | "otp" | "mfa";

const COPY: Record<
  Exclude<Mode, "mfa">,
  { title: string; subtitle: string; cta: string }
> = {
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
  otp: {
    title: "Email a one-time code",
    subtitle: "We'll send a 6-digit code. No password needed.",
    cta: "Send code",
  },
};

async function readAuthJson(res: Response): Promise<{
  error?: string;
  notice?: string;
  ok?: boolean;
  mfaRequired?: boolean;
  enrollRequired?: boolean;
  factorId?: string | null;
}> {
  try {
    return await res.json();
  } catch {
    return { error: "Something went wrong. Try again." };
  }
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = safeRedirectPath(params.get("redirect"));
  const linkError = params.get("error") === "link";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    linkError ? "That sign-in link is invalid or expired. Please try again." : ""
  );
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    Promise.all([
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ]).then(([aal, factors]) => {
      if (
        aal.data?.nextLevel === "aal2" &&
        aal.data.currentLevel !== "aal2"
      ) {
        const totp = factors.data?.totp.find((f) => f.status === "verified");
        if (totp) {
          setFactorId(totp.id);
          setMode("mfa");
          setNotice("Enter the 6-digit code from your authenticator app.");
        }
      }
    });
  }, []);

  const signupHref =
    redirect !== "/explorer"
      ? `/signup?redirect=${encodeURIComponent(redirect)}`
      : "/signup";

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setNotice("");
    setOtpSent(false);
    setOtpCode("");
    setMfaCode("");
  }

  function finishSignIn(enrollRequired?: boolean) {
    if (enrollRequired) {
      router.replace(signupHref);
      router.refresh();
      return;
    }
    router.replace(redirect);
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return;

    setLoading(true);
    setError("");
    setNotice("");

    try {
      if (mode === "signin") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const data = await readAuthJson(res);
        if (res.status === 429) {
          setError(data.error || "Too many sign-in attempts. Try again later.");
          return;
        }
        if (data.mfaRequired) {
          setFactorId(data.factorId ?? null);
          setMode("mfa");
          setNotice("Enter the 6-digit code from your authenticator app.");
          return;
        }
        if (!res.ok) {
          setError(data.error || "Email or password is incorrect.");
          return;
        }
        finishSignIn(data.enrollRequired);
        return;
      }

      if (mode === "mfa") {
        if (!factorId) {
          setError("Sign in again to continue two-factor verification.");
          setMode("signin");
          return;
        }
        const res = await fetch("/api/auth/mfa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ factorId, code: mfaCode }),
        });
        const data = await readAuthJson(res);
        if (!res.ok) {
          setError(data.error || "That authenticator code is invalid.");
          return;
        }
        finishSignIn(data.enrollRequired);
        return;
      }

      if (mode === "otp") {
        if (!otpSent) {
          const res = await fetch("/api/auth/otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ email: email.trim(), action: "send" }),
          });
          const data = await readAuthJson(res);
          if (!res.ok) {
            setError(data.error || "Couldn't send a code. Try again.");
            return;
          }
          setOtpSent(true);
          setNotice(data.notice || "Check your email for a one-time code.");
          return;
        }

        const res = await fetch("/api/auth/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            email: email.trim(),
            action: "verify",
            token: otpCode,
          }),
        });
        const data = await readAuthJson(res);
        if (!res.ok) {
          setError(data.error || "That code is invalid or expired.");
          return;
        }
        finishSignIn(data.enrollRequired);
        return;
      }

      if (mode === "forgot") {
        const res = await fetch("/api/auth/forgot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = await readAuthJson(res);
        if (!res.ok) {
          setError(data.error || "Couldn't send a reset link. Try again.");
          return;
        }
        setNotice(
          data.notice ||
            `If an account exists for ${email.trim()}, a password-reset link is on its way.`
        );
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const copy =
    mode === "mfa"
      ? {
          title: "Two-factor authentication",
          subtitle: "Confirm it's you with your authenticator app.",
          cta: "Verify",
        }
      : COPY[mode];

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
        {mode !== "mfa" && (
          <Field
            label="Email"
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || !isSupabaseConfigured || (mode === "otp" && otpSent)}
          />
        )}

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

        {mode === "otp" && otpSent && (
          <Field
            label="One-time code"
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            pattern="[0-9]*"
            maxLength={8}
            placeholder="123456"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            disabled={loading}
          />
        )}

        {mode === "mfa" && (
          <Field
            label="Authenticator code"
            id="mfa"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            pattern="[0-9]*"
            maxLength={6}
            placeholder="123456"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            disabled={loading}
          />
        )}

        <Message tone="error">{error}</Message>
        <Message tone="notice">{notice}</Message>

        <SubmitButton loading={loading} disabled={!isSupabaseConfigured}>
          {loading
            ? "Working…"
            : mode === "otp" && otpSent
              ? "Verify code"
              : copy.cta}
        </SubmitButton>

        {mode === "signin" && (
          <button
            type="button"
            onClick={() => switchMode("otp")}
            className="w-full text-center text-xs text-neutral-500 transition-colors hover:text-neutral-300"
          >
            Sign in with a one-time email code
          </button>
        )}

        {(mode === "forgot" || mode === "otp" || mode === "mfa") && (
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className="w-full text-center text-xs text-neutral-500 transition-colors hover:text-neutral-300"
          >
            ← Back to sign in
          </button>
        )}
      </form>

      <p className="mt-6 border-t border-white/[0.06] pt-4 text-center text-[11px] leading-relaxed text-neutral-500">
        The homepage,{" "}
        <Link href="/pricing" className="underline decoration-dotted hover:text-neutral-300">
          pricing
        </Link>
        , and{" "}
        <Link href="/methodology" className="underline decoration-dotted hover:text-neutral-300">
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
