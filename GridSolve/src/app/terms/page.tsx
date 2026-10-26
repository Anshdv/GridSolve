import { LegalPageShell, LegalSection } from "@/components/auth/LegalPageShell";
import { LEGAL_EMAIL } from "@/lib/legal";

export const metadata = {
  title: "Terms of Service",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "September 19, 2026";

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
          contract to use GridSolve. The Service is not directed to children
          under 13, and we do not knowingly collect personal information from
          children (COPPA). By registering, you represent that the information
          you provide — including your name and date of birth — is accurate and
          that you meet this eligibility requirement.
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
          timeline at any specific location. You remain solely responsible for
          any siting, interconnection, or commercial decisions you make.
        </p>
      </LegalSection>

      <LegalSection title="4. Account responsibilities">
        <p>
          You are responsible for maintaining the confidentiality of your login
          credentials and for all activity under your account. Notify us
          promptly at{" "}
          <a
            href={`mailto:${LEGAL_EMAIL}`}
            className="text-[var(--accent-bright)] underline"
          >
            {LEGAL_EMAIL}
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

      <LegalSection title="6. Fees, taxes, and auto-renewal">
        <p>
          GridSolve does not currently charge a subscription or other fee to
          use the Service. If we introduce paid plans, the price, billing
          period, auto-renewal terms, and how to cancel will be displayed
          immediately adjacent to the purchase button before you pay, as
          required by California&apos;s Automatic Renewal Law and similar
          statutes. We will not enroll you in an automatically renewing paid
          plan without that disclosure and your affirmative consent.
        </p>
        <p>
          If paid plans are offered to customers in the EEA/UK, applicable VAT
          will be collected at the rate of the customer&apos;s country from the
          first euro of taxable supply. Where we have economic nexus in a U.S.
          state that taxes SaaS, we will collect that tax. EEA consumers would
          retain any mandatory 14-day withdrawal right unless a permitted
          waiver is obtained at checkout.
        </p>
      </LegalSection>

      <LegalSection title="7. Intellectual property">
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

      <LegalSection title="8. Copyright (DMCA)">
        <p>
          If you believe content on the Service infringes your copyright, send a
          notice that complies with 17 U.S.C. § 512 to our designated agent as
          described on our{" "}
          <a href="/dmca" className="text-[var(--accent-bright)] underline">
            DMCA page
          </a>
          . Repeat infringers may have accounts terminated.
        </p>
      </LegalSection>

      <LegalSection title="9. Disclaimers">
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
          AVAILABLE.&rdquo; TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM
          ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS
          FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. MODEL ESTIMATES MAY BE
          INCOMPLETE, OUT OF DATE, OR INACCURATE.
        </p>
      </LegalSection>

      <LegalSection title="10. Limitation of liability">
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

      <LegalSection title="11. Dispute resolution; arbitration; class waiver">
        <p>
          These Terms are governed by the laws of the State of Delaware, USA,
          without regard to conflict-of-law principles, except where mandatory
          consumer protection laws apply in your jurisdiction.
        </p>
        <p>
          Except for claims that may be brought in small-claims court or
          actions to protect intellectual property, any dispute arising out of
          or relating to these Terms or the Service will be resolved by binding
          individual arbitration administered by the American Arbitration
          Association under its Commercial Arbitration Rules. The arbitration
          will be conducted in English. Judgment on the award may be entered in
          any court of competent jurisdiction.
        </p>
        <p>
          YOU AND GRIDSOLVE AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER
          ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR
          CLASS MEMBER IN ANY PURPORTED CLASS, CONSOLIDATED, OR REPRESENTATIVE
          PROCEEDING.
        </p>
        <p>
          If you are a consumer in a jurisdiction that does not allow mandatory
          arbitration or class waivers, this section applies only to the extent
          permitted by that law.
        </p>
      </LegalSection>

      <LegalSection title="12. Termination">
        <p>
          You may stop using the Service at any time. We may suspend or
          terminate access if you breach these Terms, if required by law, or if
          we discontinue the Service. Provisions that by their nature should
          survive termination — including disclaimers, limitations of liability,
          arbitration, and intellectual property — will survive.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact">
        <p>
          Questions about these Terms:{" "}
          <a
            href={`mailto:${LEGAL_EMAIL}`}
            className="text-[var(--accent-bright)] underline"
          >
            {LEGAL_EMAIL}
          </a>
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
