"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Message } from "@/components/auth/fields";
import {
  clearMfaEnrolled,
  MfaEnrollForm,
} from "@/components/auth/MfaEnrollForm";

type Factor = { id: string; status: string; friendly_name?: string };

export default function SecurityPage() {
  const [ready, setReady] = useState(false);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refreshFactors = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.totp ?? []);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true);
      return;
    }
    refreshFactors().finally(() => setReady(true));
  }, [refreshFactors]);

  async function unenroll(id: string) {
    setError("");
    const supabase = createClient();
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({
      factorId: id,
    });
    if (unenrollError) {
      setError(unenrollError.message);
      return;
    }
    await clearMfaEnrolled();
    setNotice("Authenticator app removed. You'll need to set it up again.");
    await refreshFactors();
    setEnrolling(true);
  }

  const verified = factors.filter((f) => f.status === "verified");

  return (
    <AuthShell
      title="Account security"
      subtitle="An authenticator app is required to sign in to GridSolve."
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

          {(enrolling || verified.length === 0) && (
            <MfaEnrollForm
              submitLabel="Confirm and enable"
              onComplete={async () => {
                setNotice("Authenticator app is now required when you sign in.");
                setEnrolling(false);
                await refreshFactors();
              }}
            />
          )}

          <Message tone="error">{error}</Message>
          <Message tone="notice">{notice}</Message>
        </div>
      )}
    </AuthShell>
  );
}
