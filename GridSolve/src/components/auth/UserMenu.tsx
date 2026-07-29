"use client";

// Auth-aware nav element. Shows the signed-in user's email + a Sign out
// button, or a "Sign in" link when logged out. Renders nothing when Supabase
// isn't configured, so the nav stays clean until auth is wired up.
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
      <Link href="/login" className={`${PILL} ${className}`}>
        Sign in
      </Link>
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
      <button onClick={signOut} disabled={signingOut} className={PILL}>
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
