"use client";

// Shared chrome for the auth screens (login, reset password): the dark
// engineering-grid backdrop + radial accent glow from the rest of the site,
// a pulsing GridSolve mark, and a centered card. Keeps every auth surface on
// brand and consistent.
import Link from "next/link";
import { motion } from "framer-motion";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07080a] px-6 py-16 text-neutral-200">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(60%_55%_at_50%_0%,rgba(61,123,255,0.12),transparent_65%)]" />

      <Link
        href="/pricing"
        className="absolute right-6 top-6 z-10 text-[13px] text-neutral-400 transition-colors hover:text-white"
      >
        Pricing
      </Link>

      <div className={`relative z-10 w-full ${wide ? "max-w-md" : "max-w-sm"}`}>
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <LogoMark />
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            GridSolve
          </span>
        </Link>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm sm:p-8">
          <h1 className="font-display text-xl font-semibold tracking-tight text-white [text-wrap:balance]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">
              {subtitle}
            </p>
          )}
          <div className="mt-6">{children}</div>
        </div>

        {footer && (
          <div className="mt-6 text-center text-xs leading-relaxed text-neutral-500">
            {footer}
          </div>
        )}
      </div>
    </main>
  );
}

function LogoMark() {
  return (
    <span className="relative flex h-7 w-7 items-center justify-center">
      <span className="absolute inset-0 rounded-[8px] border border-[var(--accent)]/40" />
      <motion.span
        className="h-2.5 w-2.5 rounded-[3px] bg-[var(--accent-bright)]"
        style={{ boxShadow: "0 0 10px 0 var(--accent)" }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </span>
  );
}
