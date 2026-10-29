import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

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
        <p className="font-tele text-[11px] uppercase tracking-[0.14em] text-neutral-400">
          Legal
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-400">
          <span>Last updated: {lastUpdated}</span>
          <Link href="/terms" className="hover:text-white">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>
          <Link href="/cookies" className="hover:text-white">
            Cookies
          </Link>
          <Link href="/refunds" className="hover:text-white">
            Refunds
          </Link>
          <Link href="/privacy/requests" className="hover:text-white">
            Data requests
          </Link>
          <Link href="/dmca" className="hover:text-white">
            DMCA
          </Link>
        </p>
        <div className="prose-legal mt-10 space-y-8 text-[15px] leading-relaxed text-neutral-400">
          {children}
        </div>
      </div>
      <SiteFooter />
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
