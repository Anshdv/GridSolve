"use client";

// Auth-aware nav element. Shows the signed-in user's email + a Sign out
// button, or a compact sign-in / sign-up control when logged out. Renders
// nothing when Supabase isn't configured, so the nav stays clean until auth
// is wired up.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const PILL =
  "rounded-full border border-white/10 px-3 py-1.5 text-xs text-neutral-300 backdrop-blur transition-colors hover:border-white/25 hover:text-white disabled:opacity-60";

export default function UserMenu({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Nothing to show until auth is configured / resolved (avoids a flash).
  if (!isSupabaseConfigured || !ready) return null;

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!email) {
    return (
      <div
        className={`inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] p-0.5 backdrop-blur ${className}`}
      >
        <Link
          href="/login"
          className="rounded-full px-3.5 py-1.5 text-xs text-neutral-400 transition-colors hover:text-white"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-full bg-[var(--accent)]/15 px-3.5 py-1.5 text-xs font-medium text-[var(--accent-bright)] transition-colors hover:bg-[var(--accent)]/25"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className="hidden max-w-[11rem] truncate font-tele text-[11px] text-neutral-500 sm:inline"
        title={email}
      >
        {email}
      </span>
      <Link href="/pricing" className={PILL}>
        Pricing
      </Link>
      <Link href="/account/security" className={PILL}>
        Security
      </Link>
      <button onClick={signOut} disabled={signingOut} className={PILL}>
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
