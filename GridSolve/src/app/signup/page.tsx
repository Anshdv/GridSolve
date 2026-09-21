"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth-errors";
import { hasEnrolledMfa, isAtLeast18, isPasswordStrong, maxDobForAdult } from "@/lib/validation";
import { isPasswordPwned } from "@/lib/password-security";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { getSiteUrl } from "@/lib/site";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field, Message, SubmitButton } from "@/components/auth/fields";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { TermsAgreement } from "@/components/auth/TermsAgreement";
import { MfaEnrollForm } from "@/components/auth/MfaEnrollForm";

function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = safeRedirectPath(params.get("redirect"));

  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [enrollMfa, setEnrollMfa] = useState(false);

  const finishSignup = useCallback(() => {
    router.replace(redirect);
    router.refresh();
  }, [redirect, router]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      if (hasEnrolledMfa(data.user.user_metadata)) {
        finishSignup();
        return;
      }
      setEnrollMfa(true);
    });
  }, [finishSignup]);

  const signupReady =
    fullName.trim().length > 0 &&
    dateOfBirth &&
    email.trim().length > 0 &&
    isAtLeast18(dateOfBirth) &&
    isPasswordStrong(password) &&
    termsAccepted;

  const dobInvalid = dateOfBirth && !isAtLeast18(dateOfBirth);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return;

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!dateOfBirth) {
      setError("Please enter your date of birth.");
      return;
    }
    if (!isAtLeast18(dateOfBirth)) {
      setError("You must be at least 18 years old to use GridSolve.");
      return;
    }
    if (!isPasswordStrong(password)) {
      setError("Please choose a password that meets all requirements.");
      return;
    }
    if (!termsAccepted) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);
    setError("");

    const submittedEmail = email.trim();

    try {
      try {
        if (await isPasswordPwned(password)) {
          setError(
            "That password appears in a known data breach. Please choose a different one."
          );
          return;
        }
      } catch {
        // HIBP unavailable — still allow a strong password through.
      }

      const supabase = createClient();
      const tosAcceptedAt = new Date().toISOString();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: submittedEmail,
        password,
        options: {
          emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(
            "/signup"
          )}`,
          data: {
            full_name: fullName.trim(),
            date_of_birth: dateOfBirth,
            tos_accepted_at: tosAcceptedAt,
          },
        },
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        setEnrollMfa(true);
        return;
      }

      setPendingEmail(submittedEmail);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  const loginHref =
    redirect !== "/explorer"
      ? `/login?redirect=${encodeURIComponent(redirect)}`
      : "/login";

  if (enrollMfa) {
    return (
      <AuthShell
        wide
        title="Set up your authenticator"
        subtitle="Scan the QR code with your authenticator app. You'll need it every time you sign in."
      >
        <MfaEnrollForm
          submitLabel="Confirm and continue"
          onComplete={finishSignup}
        />
      </AuthShell>
    );
  }

  if (pendingEmail) {
    return (
      <AuthShell
        wide
        title="Check your email"
        subtitle="Confirm your address, then you'll set up an authenticator app."
        footer={
          <>
            Already confirmed?{" "}
            <Link
              href={loginHref}
              className="font-medium text-[var(--accent-bright)] transition-colors hover:text-white"
            >
              Sign in
            </Link>
          </>
        }
      >
        <div className="space-y-5">
          <Message tone="notice">
            We sent a confirmation link to{" "}
            <span className="font-medium text-[var(--accent-bright)]">
              {pendingEmail}
            </span>
            . Open it to activate your account — next you&apos;ll add an
            authenticator app.
          </Message>
          <p className="text-xs leading-relaxed text-neutral-600">
            Didn&apos;t get it? Check spam, or wait a minute and try signing in
            — you can request a new link from there if needed.
          </p>
          <Link
            href={loginHref}
            className="flex w-full items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:border-white/20 hover:text-white"
          >
            Go to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      wide
      title="Create your account"
      subtitle="Enter your details below. Any email address is welcome — work, school, or personal."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={loginHref}
            className="font-medium text-[var(--accent-bright)] transition-colors hover:text-white"
          >
            Sign in
          </Link>
        </>
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
          label="Full name"
          id="full-name"
          type="text"
          autoComplete="name"
          required
          placeholder="Jane Smith"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={loading || !isSupabaseConfigured}
        />

        <div>
          <Field
            label="Date of birth"
            id="dob"
            type="date"
            autoComplete="bday"
            required
            max={maxDobForAdult()}
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            disabled={loading || !isSupabaseConfigured}
          />
          <p className="mt-2 text-xs text-neutral-600">
            You must be 18 or older. We collect date of birth only to enforce
            this age gate (COPPA / eligibility) — not for marketing.
          </p>
          {dobInvalid && (
            <p className="mt-2 text-xs text-red-400/90">
              You must be at least 18 years old to create an account.
            </p>
          )}
        </div>

        <div>
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
          <p className="mt-2 text-xs text-neutral-600">
            Use any valid email — there is no domain restriction.
          </p>
        </div>

        <div>
          <PasswordField
            label="Password"
            id="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || !isSupabaseConfigured}
          />
          <PasswordRequirements password={password} checkBreaches />
        </div>

        <TermsAgreement
          checked={termsAccepted}
          onChange={setTermsAccepted}
          disabled={loading || !isSupabaseConfigured}
        />

        <p className="text-xs leading-relaxed text-neutral-500">
          Next you&apos;ll scan a QR code with an authenticator app. That
          second factor is required to finish creating your account.
        </p>

        <Message tone="error">{error}</Message>

        <SubmitButton
          loading={loading}
          disabled={!isSupabaseConfigured || !signupReady}
        >
          {loading ? "Creating account…" : "Continue to authenticator"}
        </SubmitButton>
      </form>

      <p className="mt-6 border-t border-white/[0.06] pt-4 text-center text-[11px] leading-relaxed text-neutral-600">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline decoration-dotted hover:text-neutral-400">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline decoration-dotted hover:text-neutral-400">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthShell>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={<AuthShell wide title="Create your account">Loading…</AuthShell>}
    >
      <SignUpForm />
    </Suspense>
  );
}
