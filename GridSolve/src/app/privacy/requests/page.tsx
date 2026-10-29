import { LegalPageShell, LegalSection } from "@/components/auth/LegalPageShell";
import { DataRequestForm } from "@/components/privacy/DataRequestForm";
import { PRIVACY_EMAIL } from "@/lib/legal";

export const metadata = {
  title: "Data requests",
  alternates: { canonical: "/privacy/requests" },
};

export default function DataRequestsPage() {
  return (
    <LegalPageShell title="Data requests" lastUpdated="October 27, 2026">
      <LegalSection title="Access, correction, and deletion">
        <p>
          You can ask for a copy of the personal information we hold for your
          account, a correction, or deletion. We use the email on the account
          to verify the request. Deletion removes the account and the profile
          data tied to it. We may keep security logs and records we are
          required to retain, then delete or anonymize those on their normal
          schedule.
        </p>
        <p>
          We do not collect information from children, and we do not use
          account data to train a model.
        </p>
        <DataRequestForm />
        <p>
          Or email{" "}
          <a
            href={`mailto:${PRIVACY_EMAIL}?subject=${encodeURIComponent("GridSolve data request")}`}
            className="text-[var(--accent-bright)] underline"
          >
            {PRIVACY_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
