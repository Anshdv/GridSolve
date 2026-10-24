"use client";

// Auth-aware nav element. Logged out: text links. Signed in: one account
// control that opens Security and Sign out, so the bar stays a navigation
// bar instead of a row of pills. Renders nothing when Supabase isn't
// configured.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const ITEM =
  "block w-full px-3 py-2 text-left text-[13px] text-neutral-200 transition-colors hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--accent)]";

export default function UserMenu({
  className = "",
  layout = "menu",
}: {
  className?: string;
  layout?: "menu" | "inline";
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
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

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!isSupabaseConfigured || !ready) return null;

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  if (!email) {
    if (layout === "inline") {
      return (
        <div className={`flex flex-col ${className}`}>
          <Link
            href="/login"
            className="py-2.5 text-[15px] text-neutral-300 transition-colors hover:text-white"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="py-2.5 text-[15px] text-white transition-colors hover:text-neutral-200"
          >
            Sign up
          </Link>
        </div>
      );
    }
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <Link
          href="/login"
          className="text-[13px] text-neutral-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="text-[13px] text-neutral-200 transition-colors hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
        >
          Sign up
        </Link>
      </div>
    );
  }

  if (layout === "inline") {
    return (
      <div className={className}>
        <p className="truncate py-2 font-tele text-[11px] text-neutral-500" title={email}>
          {email}
        </p>
        <Link
          href="/account/security"
          className="block py-2.5 text-[15px] text-neutral-200 transition-colors hover:text-white"
        >
          Security
        </Link>
        <button
          onClick={signOut}
          disabled={signingOut}
          className="block py-2.5 text-left text-[15px] text-neutral-400 transition-colors hover:text-white disabled:opacity-60"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={email}
        className="max-w-[11rem] truncate text-[13px] text-neutral-300 transition-colors hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
      >
        {email}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-52 border border-white/10 bg-[#0c0d10] py-1"
        >
          <p className="truncate px-3 py-2 font-tele text-[11px] text-neutral-500" title={email}>
            {email}
          </p>
          <Link
            href="/account/security"
            role="menuitem"
            className={ITEM}
            onClick={() => setOpen(false)}
          >
            Security
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            disabled={signingOut}
            className={`${ITEM} disabled:opacity-60`}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
