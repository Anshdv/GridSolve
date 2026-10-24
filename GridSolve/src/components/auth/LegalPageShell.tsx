import Link from "next/link";
import SiteNav from "@/components/SiteNav";

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
      <SiteNav />

      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="font-tele text-[11px] uppercase tracking-[0.14em] text-neutral-500">
          Legal
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
          <span>Last updated: {lastUpdated}</span>
          <Link href="/terms" className="transition-colors hover:text-neutral-300">
            Terms
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-neutral-300">
            Privacy
          </Link>
          <Link href="/dmca" className="transition-colors hover:text-neutral-300">
            DMCA
          </Link>
        </p>
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
