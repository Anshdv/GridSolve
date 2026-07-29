"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth-errors";
import { isAtLeast18, isPasswordStrong } from "@/lib/validation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field, Message, SubmitButton } from "@/components/auth/fields";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { TermsAgreement } from "@/components/auth/TermsAgreement";

function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/explorer";

  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
    setNotice("");

    try {
      const supabase = createClient();
      const tosAcceptedAt = new Date().toISOString();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            redirect
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
        router.replace(redirect);
        router.refresh();
        return;
      }

      setNotice(
        `Almost there — we sent a confirmation link to ${email.trim()}. Click it to activate your account, then sign in.`
      );
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
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
            href={`/login${redirect !== "/explorer" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
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
            max={new Date().toISOString().split("T")[0]}
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            disabled={loading || !isSupabaseConfigured}
          />
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
          <PasswordRequirements password={password} />
        </div>

        <TermsAgreement
          checked={termsAccepted}
          onChange={setTermsAccepted}
          disabled={loading || !isSupabaseConfigured}
        />

        <Message tone="error">{error}</Message>
        <Message tone="notice">{notice}</Message>

        <SubmitButton
          loading={loading}
          disabled={!isSupabaseConfigured || !signupReady}
        >
          {loading ? "Creating account…" : "Create account"}
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
