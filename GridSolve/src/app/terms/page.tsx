import { LegalPageShell, LegalSection } from "@/components/auth/LegalPageShell";

export const metadata = {
  title: "Terms of Service",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "July 29, 2026";

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <LegalSection title="1. Agreement to terms">
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and
          use of GridSolve, including our website, interconnection capacity
          explorer, analytics, and related services (collectively, the
          &ldquo;Service&rdquo;). By creating an account, checking the
          agreement box at registration, or otherwise using the Service, you
          agree to be bound by these Terms and our{" "}
          <a href="/privacy" className="text-[var(--accent-bright)] underline">
            Privacy Policy
          </a>
          .
        </p>
        <p>
          If you do not agree, you may not access or use the Service. We may
          update these Terms from time to time. Material changes will be
          communicated through the Service or by email. Continued use after
          changes take effect constitutes acceptance of the revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility">
        <p>
          You must be at least 18 years old and capable of forming a binding
          contract to use GridSolve. By registering, you represent that the
          information you provide — including your name and date of birth — is
          accurate and that you meet this eligibility requirement.
        </p>
      </LegalSection>

      <LegalSection title="3. The Service">
        <p>
          GridSolve provides analytical tools and modeled estimates related to
          electric grid interconnection capacity, queue dynamics, and substation
          suitability. Outputs are derived from third-party datasets, statistical
          models, and assumptions documented in our methodology.
        </p>
        <p>
          The Service is provided for informational and planning purposes only.
          It does not constitute engineering advice, legal advice, investment
          advice, or a guarantee of interconnection availability, cost, or
          timeline at any specific location.
        </p>
      </LegalSection>

      <LegalSection title="4. Account responsibilities">
        <p>
          You are responsible for maintaining the confidentiality of your login
          credentials and for all activity under your account. Notify us
          promptly at{" "}
          <a
            href="mailto:legal@gridsolve.com"
            className="text-[var(--accent-bright)] underline"
          >
            legal@gridsolve.com
          </a>{" "}
          if you suspect unauthorized access.
        </p>
        <p>
          You agree not to share accounts, scrape or bulk-export data beyond
          permitted use, reverse engineer the Service, interfere with its
          operation, or use it in violation of applicable law or third-party
          rights.
        </p>
      </LegalSection>

      <LegalSection title="5. Acceptable use">
        <p>
          You may use GridSolve only for lawful business or research purposes
          consistent with these Terms. Prohibited uses include attempting to
          bypass access controls, reselling raw data or model outputs without
          authorization, submitting false registration information, and using
          the Service to develop competing datasets derived from unauthorized
          extraction.
        </p>
      </LegalSection>

      <LegalSection title="6. Intellectual property">
        <p>
          GridSolve, its software, visual design, documentation, and proprietary
          model outputs are owned by us or our licensors. We grant you a limited,
          non-exclusive, non-transferable license to access and use the Service
          for your internal business purposes during your subscription or
          authorized access period.
        </p>
        <p>
          Third-party data incorporated into the Service remains subject to its
          respective licenses. Nothing in these Terms transfers ownership of
          underlying source datasets to you.
        </p>
      </LegalSection>

      <LegalSection title="7. Disclaimers">
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
          AVAILABLE.&rdquo; TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM
          ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS
          FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. MODEL ESTIMATES MAY BE
          INCOMPLETE, OUT OF DATE, OR INACCURATE.
        </p>
      </LegalSection>

      <LegalSection title="8. Limitation of liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, GRIDSOLVE AND ITS AFFILIATES
          WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, DATA, OR
          BUSINESS OPPORTUNITIES, ARISING FROM YOUR USE OF THE SERVICE. OUR
          AGGREGATE LIABILITY FOR ANY CLAIM RELATING TO THE SERVICE IS LIMITED
          TO THE GREATER OF (A) AMOUNTS YOU PAID US IN THE TWELVE MONTHS BEFORE
          THE CLAIM OR (B) ONE HUNDRED U.S. DOLLARS ($100).
        </p>
      </LegalSection>

      <LegalSection title="9. Termination">
        <p>
          You may stop using the Service at any time. We may suspend or
          terminate access if you breach these Terms, if required by law, or if
          we discontinue the Service. Provisions that by their nature should
          survive termination — including disclaimers, limitations of liability,
          and intellectual property — will survive.
        </p>
      </LegalSection>

      <LegalSection title="10. Governing law & contact">
        <p>
          These Terms are governed by the laws of the State of Delaware, USA,
          without regard to conflict-of-law principles, except where mandatory
          consumer protection laws apply in your jurisdiction.
        </p>
        <p>
          Questions about these Terms:{" "}
          <a
            href="mailto:legal@gridsolve.com"
            className="text-[var(--accent-bright)] underline"
          >
            legal@gridsolve.com
          </a>
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
