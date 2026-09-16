"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field, Message, SubmitButton } from "@/components/auth/fields";

type Factor = { id: string; status: string; friendly_name?: string };

export default function SecurityPage() {
  const [ready, setReady] = useState(false);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function refreshFactors() {
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.totp ?? []);
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true);
      return;
    }
    refreshFactors().finally(() => setReady(true));
  }, []);

  async function startEnroll() {
    setError("");
    setNotice("");
    setEnrolling(true);
    const supabase = createClient();
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator",
    });
    if (enrollError || !data) {
      setError(
        enrollError?.message ||
          "Couldn't start authenticator setup. MFA may be disabled in Supabase."
      );
      setEnrolling(false);
      return;
    }
    setFactorId(data.id);
    setQr(data.totp.qr_code);
    setSecret(data.totp.secret);
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: code.replace(/\s/g, ""),
      });
      if (verifyError) throw verifyError;
      setNotice("Authenticator app is now required when you sign in.");
      setEnrolling(false);
      setQr(null);
      setSecret(null);
      setCode("");
      await refreshFactors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't verify that code.");
    } finally {
      setLoading(false);
    }
  }

  async function unenroll(id: string) {
    setError("");
    const supabase = createClient();
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (unenrollError) {
      setError(unenrollError.message);
      return;
    }
    setNotice("Authenticator app removed from this account.");
    await refreshFactors();
  }

  const verified = factors.filter((f) => f.status === "verified");

  return (
    <AuthShell
      title="Account security"
      subtitle="Add an authenticator app so a stolen password isn't enough to sign in."
      footer={
        <Link
          href="/explorer"
          className="font-medium text-[var(--accent-bright)] transition-colors hover:text-white"
        >
          ← Back to explorer
        </Link>
      }
    >
      {!ready ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : (
        <div className="space-y-4">
          {verified.length > 0 && !enrolling && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-3">
              <p className="text-xs font-medium text-neutral-300">
                Two-factor authentication is on
              </p>
              <ul className="mt-2 space-y-2">
                {verified.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-3 text-xs text-neutral-400"
                  >
                    <span>{f.friendly_name || "Authenticator"}</span>
                    <button
                      type="button"
                      onClick={() => unenroll(f.id)}
                      className="text-red-400/90 transition-colors hover:text-red-300"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!enrolling && verified.length === 0 && (
            <button
              type="button"
              onClick={startEnroll}
              className="flex w-full items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-bright)]"
            >
              Set up authenticator app
            </button>
          )}

          {enrolling && (
            <form onSubmit={confirmEnroll} className="space-y-4">
              {qr && (
                <div className="flex justify-center rounded-lg border border-white/10 bg-white p-3">
                  {/* Supabase returns a data:image SVG/PNG URI */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt="Authenticator QR code" className="h-40 w-40" />
                </div>
              )}
              {secret && (
                <p className="break-all text-center font-tele text-[11px] text-neutral-500">
                  Secret: {secret}
                </p>
              )}
              <Field
                label="6-digit code"
                id="enroll-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
              />
              <SubmitButton loading={loading}>
                {loading ? "Verifying…" : "Confirm and enable"}
              </SubmitButton>
              <button
                type="button"
                onClick={() => {
                  setEnrolling(false);
                  setQr(null);
                  setSecret(null);
                  setCode("");
                }}
                className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300"
              >
                Cancel
              </button>
            </form>
          )}

          <Message tone="error">{error}</Message>
          <Message tone="notice">{notice}</Message>
        </div>
      )}
    </AuthShell>
  );
}
