import { LegalPageShell, LegalSection } from "@/components/auth/LegalPageShell";
import { UnsubscribeForm } from "./UnsubscribeForm";

export const metadata = {
  title: "Email preferences",
  alternates: { canonical: "/unsubscribe" },
};

export default function UnsubscribePage() {
  return (
    <LegalPageShell title="Email preferences" lastUpdated="September 19, 2026">
      <LegalSection title="Optional product emails">
        <p>
          GridSolve does not currently send marketing or promotional email.
          Account, security, and sign-in messages are transactional and cannot
          be turned off while your account is open.
        </p>
        <UnsubscribeForm />
      </LegalSection>
    </LegalPageShell>
  );
}
