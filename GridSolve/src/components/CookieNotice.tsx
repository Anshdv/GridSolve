"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "gridsolve-cookie-notice";

export function CookieNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* private mode — hide for this view only */
    }
    setOpen(false);
  }

  return (
    <aside
      aria-label="Cookie notice"
      className="no-print fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-xl flex-col gap-3 rounded-lg border border-white/10 bg-[#101216] px-4 py-3 text-sm text-neutral-300 shadow-none sm:inset-x-auto sm:right-4 sm:flex-row sm:items-end"
    >
      <p className="leading-relaxed">
        GridSolve uses an essential cookie to keep you signed in. We do not
        set advertising or analytics cookies.{" "}
        <Link
          href="/cookies"
          className="text-[var(--accent-bright)] underline underline-offset-2"
        >
          Cookie policy
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded-md border border-white/15 px-3 py-1.5 text-sm text-white hover:border-white/30"
      >
        Dismiss
      </button>
    </aside>
  );
}
