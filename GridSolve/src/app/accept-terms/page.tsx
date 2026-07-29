"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatAuthError } from "@/lib/auth-errors";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Message, SubmitButton } from "@/components/auth/fields";
import { TermsAgreement } from "@/components/auth/TermsAgreement";

function AcceptTermsForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/explorer";

  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured || !accepted) return;
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { tos_accepted_at: new Date().toISOString() },
      });
      if (updateError) throw updateError;
      router.replace(redirect);
      router.refresh();
    } catch (err) {
      setError(formatAuthError(err));
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Review our policies"
      subtitle="Please read and accept the Terms of Service and Privacy Policy to continue using GridSolve."
    >
      <div className="mb-5 space-y-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-4 text-xs leading-relaxed text-neutral-400">
        <p>
          GridSolve provides modeled interconnection analytics for planning
          purposes. Outputs are estimates — not engineering, legal, or
          investment advice.
        </p>
        <p>
          Read the full{" "}
          <Link
            href="/terms"
            target="_blank"
            className="text-[var(--accent-bright)] underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            target="_blank"
            className="text-[var(--accent-bright)] underline"
          >
            Privacy Policy
          </Link>{" "}
          before continuing.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <TermsAgreement
          checked={accepted}
          onChange={setAccepted}
          disabled={loading || !isSupabaseConfigured}
        />
        <Message tone="error">{error}</Message>
        <SubmitButton
          loading={loading}
          disabled={!isSupabaseConfigured || !accepted}
        >
          {loading ? "Saving…" : "Accept and continue"}
        </SubmitButton>
      </form>
    </AuthShell>
  );
}

export default function AcceptTermsPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Review our policies">Loading…</AuthShell>
      }
    >
      <AcceptTermsForm />
    </Suspense>
  );
}
