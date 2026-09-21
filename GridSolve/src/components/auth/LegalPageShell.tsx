import Link from "next/link";

export function LegalPageShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#07080a] text-neutral-200">
      <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#07080a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-sm text-neutral-300 transition-colors hover:text-white"
          >
            ← GridSolve
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/pricing"
              className="text-neutral-400 transition-colors hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="/terms"
              className="text-neutral-400 transition-colors hover:text-white"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-neutral-400 transition-colors hover:text-white"
            >
              Privacy
            </Link>
            <Link
              href="/dmca"
              className="text-neutral-400 transition-colors hover:text-white"
            >
              DMCA
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="font-tele text-[11px] uppercase tracking-[0.14em] text-neutral-500">
          Legal
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-neutral-500">Last updated: {lastUpdated}</p>
        <div className="prose-legal mt-10 space-y-8 text-[15px] leading-relaxed text-neutral-400">
          {children}
        </div>
      </div>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
