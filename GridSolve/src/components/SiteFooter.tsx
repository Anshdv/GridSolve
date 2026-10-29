import Link from "next/link";
import {
  LEGAL_EMAIL,
  getLegalEntityName,
  getLegalMailingAddress,
} from "@/lib/legal";

const PRODUCT = [
  ["/", "About"],
  ["/interconnection-queue", "Queue"],
  ["/faqs", "FAQs"],
  ["/pricing", "Pricing"],
  ["/methodology", "Methodology"],
] as const;

const LEGAL = [
  ["/terms", "Terms"],
  ["/privacy", "Privacy"],
  ["/cookies", "Cookies"],
  ["/refunds", "Refunds"],
  ["/privacy/requests", "Data requests"],
  ["/dmca", "DMCA"],
  ["/unsubscribe", "Email preferences"],
] as const;

export function SiteFooter() {
  const entity = getLegalEntityName();
  const address = getLegalMailingAddress();

  return (
    <footer className="no-print border-t border-white/[0.06]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-xs leading-relaxed text-neutral-400">
        <p>
          © {new Date().getFullYear()} {entity}. GridSolve is operated by{" "}
          {entity}.
          {address ? ` ${address}.` : ""}{" "}
          <a
            href={`mailto:${LEGAL_EMAIL}`}
            className="underline decoration-white/20 underline-offset-2 hover:text-white"
          >
            {LEGAL_EMAIL}
          </a>
        </p>
        <p>
          Archivo and Martian Mono are self-hosted under the SIL Open Font
          License. The site does not load fonts or images from a third-party
          CDN.
        </p>
        <p className="font-tele text-[11px] text-neutral-400">
          Withdrawal benchmark: LBNL, Queued Up
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          {PRODUCT.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="hover:text-white"
            >
              {label}
            </Link>
          ))}
          {LEGAL.map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
