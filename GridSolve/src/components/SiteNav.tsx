"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "@/components/auth/UserMenu";

const LINKS = [
  { href: "/methodology", label: "Methodology" },
  { href: "/pricing", label: "Pricing" },
  { href: "/interconnection-queue", label: "Queue" },
] as const;

function LogoMark() {
  return (
    <span className="relative flex h-5 w-5 items-center justify-center" aria-hidden>
      <span className="absolute inset-0 rounded-[5px] border border-[var(--accent)]/50" />
      <span className="h-1.5 w-1.5 rounded-[1px] bg-[var(--accent-bright)]" />
    </span>
  );
}

export default function SiteNav({
  variant = "marketing",
  canAnimate = false,
}: {
  variant?: "marketing" | "explorer";
  canAnimate?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const onExplorer = pathname === "/explorer" || variant === "explorer";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`relative z-30 border-b border-white/[0.08] bg-[#07080a]/95 backdrop-blur-md ${
        variant === "marketing" ? "sticky top-0" : "no-print shrink-0"
      } ${canAnimate ? "gs-nav-in" : ""}`}
    >
      <div
        className={`mx-auto flex h-12 items-center gap-8 px-4 sm:px-6 ${
          variant === "marketing" ? "max-w-6xl" : ""
        }`}
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
        >
          <LogoMark />
          <span className="font-display text-[15px] font-semibold tracking-tight">
            GridSolve
          </span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex" aria-label="Primary">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`border-b py-1 text-[13px] transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] ${
                  active
                    ? "border-[var(--accent-bright)] text-white"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-5">
          <div className="hidden md:block">
            <UserMenu />
          </div>
          {!onExplorer && (
            <Link
              href="/explorer"
              className="hidden h-8 items-center rounded-md bg-[var(--accent)] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-bright)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white md:inline-flex"
            >
              Explorer
            </Link>
          )}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center text-neutral-200 md:hidden"
            aria-expanded={open}
            aria-controls="site-nav-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block h-3 w-4" aria-hidden>
              <span
                className={`absolute left-0 h-px w-4 bg-current transition-transform ${
                  open ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 h-px w-4 bg-current transition-opacity ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 h-px w-4 bg-current transition-transform ${
                  open ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="site-nav-menu"
          aria-label="Primary"
          className="absolute inset-x-0 top-full border-b border-white/10 bg-[#07080a] px-5 py-3 md:hidden"
        >
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`block py-2.5 text-[15px] ${
                  active ? "text-white" : "text-neutral-300"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="my-2 h-px bg-white/10" />
          <UserMenu layout="inline" />
          {!onExplorer && (
            <Link
              href="/explorer"
              className="mt-3 flex h-10 items-center justify-center rounded-md bg-[var(--accent)] text-[14px] font-medium text-white"
            >
              Open the explorer
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
