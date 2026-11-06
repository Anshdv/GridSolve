import { getSiteUrl } from "@/lib/site";

export const LEGAL_EMAIL = "adevlekar@grid-solve.com";
export const PRIVACY_EMAIL = "adevlekar@grid-solve.com";
export const DMCA_EMAIL = "adevlekar@grid-solve.com";

export function getLegalEntityName(): string {
  return process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME?.trim() || "DeepSlate Labs LLC";
}

/** Street address when configured. Empty until NEXT_PUBLIC_LEGAL_MAILING_ADDRESS is set. */
export function getLegalMailingAddress(): string {
  return process.env.NEXT_PUBLIC_LEGAL_MAILING_ADDRESS?.trim() || "";
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
  const addressLine = address ? `${address}<br />` : "";
  return `<p style="margin:16px 0 0;color:#a3a3a3;font-size:11px;line-height:1.6;">
    This message is a transactional account email from ${getLegalEntityName()}.
    It is not marketing. Security and account messages cannot be turned off while
    your account is open.<br /><br />
    ${addressLine}
    <a href="${unsub}" style="color:#5b93ff;">Unsubscribe from optional product emails</a>
    · <a href="mailto:${PRIVACY_EMAIL}" style="color:#5b93ff;">${PRIVACY_EMAIL}</a>
  </p>`;
}

export function emailComplianceFooterText(): string {
  const address = getLegalMailingAddress();
  return [
    "",
    `This is a transactional account email from ${getLegalEntityName()}, not marketing.`,
    ...(address ? [address] : []),
    `Optional product emails: ${getUnsubscribeUrl()}`,
    PRIVACY_EMAIL,
  ].join("\n");
}
