import { getSiteUrl } from "@/lib/site";

export const LEGAL_EMAIL = "legal@gridsolve.com";
export const PRIVACY_EMAIL = "privacy@gridsolve.com";
export const DMCA_EMAIL = "dmca@gridsolve.com";

export function getLegalEntityName(): string {
  return process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME?.trim() || "GridSolve";
}

export function getLegalMailingAddress(): string {
  return (
    process.env.NEXT_PUBLIC_LEGAL_MAILING_ADDRESS?.trim() ||
    "Set NEXT_PUBLIC_LEGAL_MAILING_ADDRESS (street or PO Box, city, state, ZIP) — required for CAN-SPAM and DMCA agent listing."
  );
}

export function getDmcaAgentName(): string {
  return (
    process.env.NEXT_PUBLIC_DMCA_AGENT_NAME?.trim() || getLegalEntityName()
  );
}

export function getUnsubscribeUrl(): string {
  return `${getSiteUrl()}/unsubscribe`;
}

export function emailComplianceFooterHtml(): string {
  const address = getLegalMailingAddress();
  const unsub = getUnsubscribeUrl();
  return `<p style="margin:16px 0 0;color:#737373;font-size:11px;line-height:1.6;">
    This message is a transactional account email from ${getLegalEntityName()}.
    It is not marketing. Security and account messages cannot be turned off while
    your account is open.<br /><br />
    ${address}<br />
    <a href="${unsub}" style="color:#5b93ff;">Unsubscribe from optional product emails</a>
    · <a href="mailto:${PRIVACY_EMAIL}" style="color:#5b93ff;">${PRIVACY_EMAIL}</a>
  </p>`;
}

export function emailComplianceFooterText(): string {
  return [
    "",
    `This is a transactional account email from ${getLegalEntityName()}, not marketing.`,
    getLegalMailingAddress(),
    `Optional product emails: ${getUnsubscribeUrl()}`,
    PRIVACY_EMAIL,
  ].join("\n");
}
