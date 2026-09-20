import { LegalPageShell, LegalSection } from "@/components/auth/LegalPageShell";
import {
  DMCA_EMAIL,
  getDmcaAgentName,
  getLegalEntityName,
  getLegalMailingAddress,
  LEGAL_EMAIL,
} from "@/lib/legal";

export const metadata = {
  title: "DMCA / Copyright",
  alternates: { canonical: "/dmca" },
};

export default function DmcaPage() {
  const agent = getDmcaAgentName();
  const address = getLegalMailingAddress();

  return (
    <LegalPageShell title="DMCA designated agent" lastUpdated="September 19, 2026">
      <LegalSection title="How to send a takedown notice">
        <p>
          If you believe material on GridSolve infringes your copyright, send a
          written notice under the Digital Millennium Copyright Act (17 U.S.C.
          § 512) to our designated agent:
        </p>
        <p className="text-neutral-300">
          {agent}
          <br />
          {getLegalEntityName()}
          <br />
          {address}
          <br />
          Email:{" "}
          <a href={`mailto:${DMCA_EMAIL}`} className="text-[var(--accent-bright)] underline">
            {DMCA_EMAIL}
          </a>
          {" "}(copy{" "}
          <a href={`mailto:${LEGAL_EMAIL}`} className="text-[var(--accent-bright)] underline">
            {LEGAL_EMAIL}
          </a>
          )
        </p>
        <p>
          Your notice must include: (1) your physical or electronic signature;
          (2) identification of the copyrighted work; (3) identification of the
          material you claim is infringing and where it appears on the Service;
          (4) your contact information; (5) a statement that you have a good-faith
          belief the use is not authorized; and (6) a statement, under penalty of
          perjury, that the information in the notice is accurate and that you
          are the copyright owner or authorized to act.
        </p>
      </LegalSection>

      <LegalSection title="Counter-notice">
        <p>
          If your material was removed and you believe that was a mistake, you
          may send a counter-notification to the same agent with the information
          required by 17 U.S.C. § 512(g).
        </p>
      </LegalSection>

      <LegalSection title="Registration">
        <p>
          U.S. law also requires filing the designated-agent directory listing
          with the U.S. Copyright Office (currently a small fee). That filing
          is an operator step outside this website. Keep this page consistent
          with whatever you file.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
