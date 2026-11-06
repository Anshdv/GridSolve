import Link from "next/link";
import {
  LEGAL_EMAIL,
  PRIVACY_EMAIL,
  SECURITY_EMAIL,
  SUPPORT_EMAIL,
  getLegalEntityName,
  getLegalMailingAddress,
} from "@/lib/legal";

const PRODUCT = [
  ["/about", "About"],
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

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: readonly (readonly [string, string])[];
}) {
  return (
    <div>
      <h2 className="font-tele text-[11px] uppercase tracking-[0.14em] text-neutral-400">
        {title}
      </h2>
      <ul className="mt-3 flex flex-col">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link
              href={href}
              className="inline-flex py-1.5 text-[13px] leading-snug text-neutral-300 transition-colors duration-150 hover:text-white"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const entity = getLegalEntityName();
  const address = getLegalMailingAddress();

  return (
    <footer className="no-print border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="max-w-md text-xs leading-relaxed text-neutral-400 sm:col-span-2 lg:col-span-6">
            <p className="font-display text-sm font-semibold tracking-tight text-white">
              GridSolve
            </p>
            <p className="mt-3">
              © {new Date().getFullYear()} {entity}. GridSolve is operated by{" "}
              {entity}.
              {address ? ` ${address}.` : ""}
            </p>
            <p className="mt-2 flex flex-col gap-1">
              {(
                [
                  ["Support", SUPPORT_EMAIL],
                  ["Legal", LEGAL_EMAIL],
                  ["Privacy", PRIVACY_EMAIL],
                  ["Security", SECURITY_EMAIL],
                ] as const
              ).map(([label, email]) => (
                <a
                  key={email}
                  href={`mailto:${email}`}
                  className="text-neutral-300 underline decoration-white/20 underline-offset-2 transition-colors duration-150 hover:text-white"
                >
                  {label}: {email}
                </a>
              ))}
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-10 sm:col-span-2 sm:max-w-sm lg:col-span-6 lg:max-w-none lg:grid-cols-2 lg:gap-x-8"
          >
            <LinkColumn title="Product" links={PRODUCT} />
            <LinkColumn title="Legal" links={LEGAL} />
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/[0.06] pt-4 font-tele text-[11px] leading-relaxed text-neutral-400 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
          <p>
            Archivo and Martian Mono are self-hosted under the SIL Open Font
            License. The site does not load fonts or images from a third-party
            CDN.
          </p>
          <p className="shrink-0">Withdrawal benchmark: LBNL, Queued Up</p>
        </div>
      </div>
    </footer>
  );
}
