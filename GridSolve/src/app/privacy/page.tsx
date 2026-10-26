import { LegalPageShell, LegalSection } from "@/components/auth/LegalPageShell";
import { PRIVACY_EMAIL } from "@/lib/legal";

export const metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "September 19, 2026";

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <LegalSection title="1. Overview">
        <p>
          GridSolve (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
          respects your privacy. This Privacy Policy explains what personal
          information we collect when you use our website and interconnection
          analytics platform, how we use it, and the choices you have.
        </p>
        <p>
          By creating an account or using GridSolve, you acknowledge this Policy
          alongside our{" "}
          <a href="/terms" className="text-[var(--accent-bright)] underline">
            Terms of Service
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <p>
          <span className="text-neutral-200">Account information.</span> When you
          register, we collect your full name, email address, date of birth (to
          verify eligibility), and password (stored in hashed form by our
          authentication provider). We also record when you accepted our Terms
          and Privacy Policy.
        </p>
        <p>
          <span className="text-neutral-200">Usage information.</span> We
          collect standard log data such as pages viewed, feature
          interactions, browser type, IP address, and
          timestamps as needed to operate and secure the Service. We do not
          use session replay.
        </p>
        <p>
          <span className="text-neutral-200">Communications.</span> If you
          contact us, we retain the content of your message and contact details
          to respond and maintain records.
        </p>
      </LegalSection>

      <LegalSection title="3. How we use information">
        <p>We use personal information to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Create and manage your account and authenticate access</li>
          <li>Provide, maintain, and improve GridSolve features</li>
          <li>Verify age eligibility and enforce our Terms</li>
          <li>Send service-related notices, including security alerts</li>
          <li>Detect, prevent, and address fraud, abuse, or technical issues</li>
          <li>Comply with legal obligations and respond to lawful requests</li>
        </ul>
        <p>
          We do not sell your personal information. We do not use your date of
          birth for marketing profiling. We do not use session replay, heatmaps
          that record your screen, keystroke logging, or similar
          &ldquo;call-recording&rdquo; analytics. We do not load fonts or
          trackers from Google&apos;s font CDN.
        </p>
      </LegalSection>

      <LegalSection title="4. Legal bases (EEA/UK users)">
        <p>
          Where applicable, we process personal data on the bases of contract
          performance (providing the Service), legitimate interests (security,
          analytics, product improvement), legal obligation, and consent where
          required (e.g., non-essential cookies or marketing, if offered).
        </p>
      </LegalSection>

      <LegalSection title="5. Sharing & processors">
        <p>
          We share information with trusted service providers that help us
          operate GridSolve — for example, cloud hosting and authentication
          (Supabase) — under contracts that require appropriate
          safeguards. We may also disclose information if required by law, to
          protect rights and safety, or in connection with a merger or
          acquisition with notice as required.
        </p>
      </LegalSection>

      <LegalSection title="6. Cookies">
        <p>
          We use essential cookies only — primarily to keep you signed in
          (authentication session). We do not set advertising cookies or
          third-party tracking cookies. Because these cookies are required to
          operate the logged-in Service, they are not optional.
        </p>
      </LegalSection>

      <LegalSection title="7. Data retention">
        <p>
          We retain account information for as long as your account is active
          and as needed to provide the Service, resolve disputes, and meet
          legal obligations. Usage logs are retained for a limited period
          consistent with security and analytics needs, then deleted or
          anonymized.
        </p>
      </LegalSection>

      <LegalSection title="8. Security">
        <p>
          We implement administrative, technical, and organizational measures
          designed to protect personal information, including encryption in
          transit, access controls, and secure credential handling. No method
          of transmission or storage is completely secure; please use a strong,
          unique password and keep it confidential.
        </p>
      </LegalSection>

      <LegalSection title="9. Your rights & choices">
        <p>
          Depending on your location, you may have rights to access, correct,
          delete, or export your personal information, and to object to or
          restrict certain processing. To exercise these rights, contact{" "}
          <a
            href={`mailto:${PRIVACY_EMAIL}`}
            className="text-[var(--accent-bright)] underline"
          >
            {PRIVACY_EMAIL}
          </a>
          . We may need to verify your identity before responding.
        </p>
        <p>
          You may update your account email through account settings where
          available. To delete your account, contact us at the address above.
        </p>
      </LegalSection>

      <LegalSection title="10. International transfers">
        <p>
          GridSolve may process information in the United States and other
          countries where we or our providers operate. Where required, we use
          appropriate safeguards for cross-border transfers.
        </p>
      </LegalSection>

      <LegalSection title="11. Children">
        <p>
          GridSolve is not directed to children under 13 or to anyone under 18.
          We require a date of birth at signup and reject accounts that are not
          at least 18. We do not knowingly collect personal information from
          children. If you believe a minor has provided us data, contact{" "}
          <a
            href={`mailto:${PRIVACY_EMAIL}`}
            className="text-[var(--accent-bright)] underline"
          >
            {PRIVACY_EMAIL}
          </a>{" "}
          and we will delete it.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes & contact">
        <p>
          We may update this Privacy Policy periodically. The &ldquo;Last
          updated&rdquo; date at the top reflects the latest revision. Material
          changes will be communicated through the Service or by email where
          appropriate.
        </p>
        <p>
          Privacy inquiries:{" "}
          <a
            href={`mailto:${PRIVACY_EMAIL}`}
            className="text-[var(--accent-bright)] underline"
          >
            {PRIVACY_EMAIL}
          </a>
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
