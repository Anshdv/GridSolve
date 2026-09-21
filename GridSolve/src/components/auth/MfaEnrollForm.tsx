"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { brandedTotpUri, totpIssuerHost } from "@/lib/site";
import { Field, Message, SubmitButton } from "@/components/auth/fields";

export async function markMfaEnrolled() {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    data: { mfa_enrolled_at: new Date().toISOString() },
  });
  if (error) throw error;
}

export async function clearMfaEnrolled() {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    data: { mfa_enrolled_at: null },
  });
  if (error) throw error;
}

export function MfaEnrollForm({
  submitLabel = "Confirm and continue",
  onComplete,
}: {
  submitLabel?: string;
  onComplete: () => void | Promise<void>;
}) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(true);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const supabase = createClient();
      const { data: existing } = await supabase.auth.mfa.listFactors();
      const pending = (existing?.totp ?? []).filter((f) => f.status !== "verified");
      for (const factor of pending) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      const verified = (existing?.totp ?? []).find((f) => f.status === "verified");
      if (verified) {
        await markMfaEnrolled();
        if (!cancelled) await onCompleteRef.current();
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: totpIssuerHost(),
      });
      if (cancelled) return;
      if (enrollError || !data) {
        setError(
          enrollError?.message ||
            "Couldn't start authenticator setup. Enable TOTP MFA in the Supabase dashboard, then try again."
        );
        setStarting(false);
        return;
      }
      const uri = brandedTotpUri(data.totp.uri, user?.email);
      const { default: QRCode } = await import("qrcode");
      const qr = await QRCode.toDataURL(uri, {
        width: 240,
        margin: 1,
        errorCorrectionLevel: "M",
      });
      if (cancelled) return;
      setFactorId(data.id);
      setQr(qr);
      setSecret(data.totp.secret);
      setStarting(false);
    }

    start().catch((err: unknown) => {
      if (cancelled) return;
      setError(err instanceof Error ? err.message : "Couldn't start authenticator setup.");
      setStarting(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
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
      await markMfaEnrolled();
      await onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't verify that code.");
    } finally {
      setLoading(false);
    }
  }

  if (starting) {
    return <p className="text-sm text-neutral-500">Preparing your authenticator…</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {qr && (
        <div className="flex justify-center rounded-lg border border-white/10 bg-white p-3">
          {/* Supabase returns a data: URI for the QR */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Authenticator QR code" className="h-40 w-40" />
        </div>
      )}
      <p className="text-center text-xs leading-relaxed text-neutral-500">
        Scan with Google Authenticator, 1Password, Authy, or any TOTP app.
        It will be saved as {totpIssuerHost()}. Then enter the 6-digit code.
      </p>
      {secret && (
        <p className="break-all text-center font-tele text-[11px] text-neutral-500">
          Can&apos;t scan? Secret: {secret}
        </p>
      )}
      <Field
        label="6-digit code"
        id="signup-mfa-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        required
        maxLength={6}
        placeholder="123456"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        disabled={loading || !factorId}
      />
      <Message tone="error">{error}</Message>
      <SubmitButton loading={loading} disabled={!factorId}>
        {loading ? "Verifying…" : submitLabel}
      </SubmitButton>
    </form>
  );
}
