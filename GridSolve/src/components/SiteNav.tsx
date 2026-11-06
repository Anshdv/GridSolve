"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "@/components/auth/UserMenu";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/interconnection-queue", label: "Queue" },
  { href: "/explorer", label: "Explorer" },
  { href: "/methodology", label: "Methodology" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faqs", label: "FAQs" },
] as const;

function LogoMark() {
  return (
    <span className="relative flex h-5 w-5 items-center justify-center" aria-hidden>
      <span className="absolute inset-0 rounded-[5px] border border-[var(--accent)]/50" />
      <span className="h-1.5 w-1.5 rounded-[1px] bg-[var(--accent-bright)]" />
    </span>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    if (variant === "explorer") document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, variant]);

  if (variant === "explorer") {
    return (
      <>
        <button
          type="button"
          className="no-print fixed left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-[#0a0a0b]/90 text-white"
          aria-expanded={open}
          aria-controls="explorer-drawer"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <MenuIcon open={open} />
        </button>
        {open && (
          <button
            type="button"
            className="no-print fixed inset-0 z-40 bg-black/55"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
        )}
        <nav
          id="explorer-drawer"
          aria-label="Primary"
          aria-hidden={!open}
          inert={open ? undefined : true}
          className={`no-print fixed inset-y-0 left-0 z-50 flex w-[min(18rem,86vw)] flex-col bg-[#101418] px-6 py-5 shadow-[8px_0_32px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "pointer-events-none -translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-white" onClick={() => setOpen(false)}>
              <LogoMark />
              <span className="font-display text-[15px] font-semibold tracking-tight">
                GridSolve
              </span>
            </Link>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center text-white/80"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <MenuIcon open />
            </button>
          </div>
          <div className="mt-8 flex flex-col">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`w-fit border-b py-3.5 text-[15px] ${
                    active
                      ? "border-[var(--accent-bright)] text-white"
                      : "border-transparent text-white/75"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-6">
            <UserMenu layout="inline" />
          </div>
        </nav>
      </>
    );
  }

  return (
    <header
      className={`sticky top-0 z-30 border-b border-white/[0.08] bg-[#07080a] text-white ${canAnimate ? "gs-nav-in" : ""}`}
    >
      <div className="relative flex h-16 items-center px-5 sm:px-7">
        <Link
          href="/"
          className="relative z-10 flex shrink-0 items-center gap-2.5 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <LogoMark />
          <span className="font-display text-[16px] font-semibold tracking-tight">
            GridSolve
          </span>
        </Link>

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex"
          aria-label="Primary"
        >
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`relative text-[14px] transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white ${
                  active ? "text-white" : "text-neutral-400 hover:text-white"
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-2 left-0 right-0 h-px ${
                    active ? "bg-[var(--accent-bright)]" : "bg-transparent"
                  }`}
                  aria-hidden
                />
              </Link>
            );
          })}
        </nav>

        <div className="relative z-10 ml-auto flex items-center">
          <div className="hidden lg:block">
            <UserMenu />
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center text-white lg:hidden"
            aria-expanded={open}
            aria-controls="site-nav-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="site-nav-menu"
          aria-label="Primary"
          className="border-t border-white/15 px-6 py-3 lg:hidden"
        >
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-block border-b py-2.5 text-[15px] ${
                  active
                    ? "border-[var(--accent-bright)] text-white"
                    : "border-transparent text-neutral-300"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="my-2 h-px bg-white/15" />
          <UserMenu layout="inline" />
        </nav>
      )}
    </header>
  );
}
