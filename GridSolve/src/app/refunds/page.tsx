import { LegalPageShell, LegalSection } from "@/components/auth/LegalPageShell";
import { LEGAL_EMAIL } from "@/lib/legal";

export const metadata = {
  title: "Refund Policy",
  alternates: { canonical: "/refunds" },
};

export default function RefundsPage() {
  return (
    <LegalPageShell title="Refund Policy" lastUpdated="October 27, 2026">
      <LegalSection title="What the prices cover">
        <p>
          Sample access is free. Screening and Diligence prices on the{" "}
          <a href="/pricing" className="text-[var(--accent-bright)] underline">
            pricing page
          </a>{" "}
          are the full fee for that plan. There is no setup fee, no per-export
          fee, and no charge for an add-on unless that add-on and its price
          are stated in writing before you agree.
        </p>
        <p>
          The site does not take a card payment. A paid plan starts only after
          we confirm the fee, the period, and how to cancel, and you agree in
          writing. Nothing renews automatically unless that renewal is
          disclosed next to the agreement before you accept it.
        </p>
      </LegalSection>

      <LegalSection title="Refunds">
        <p>
          If you cancel before the paid period starts, we refund the fee for
          that period. After the period has started and access has been
          provided, the fee for that period is not refunded, except where the
          law requires it. That includes a withdrawal right for EEA or UK
          consumers when that right applies and has not been validly waived.
        </p>
        <p>
          Email{" "}
          <a
            href={`mailto:${LEGAL_EMAIL}`}
            className="text-[var(--accent-bright)] underline"
          >
            {LEGAL_EMAIL}
          </a>{" "}
          from the address on the license. We confirm cancellation and any
          refund in writing.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
