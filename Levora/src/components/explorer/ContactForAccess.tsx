import { getExplorerAccessEmail } from "@/lib/explorerAccess";

export default function ContactForAccess() {
  const contactEmail = getExplorerAccessEmail();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
      <p className="font-tele text-xs uppercase tracking-widest text-[var(--accent-bright)]">
        Access required
      </p>
      <h2 className="mt-4 max-w-sm font-display text-lg font-semibold tracking-tight text-white [text-wrap:balance]">
        Contact us to view substation scores and details
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-500">
        The map is available to browse, but substation lists, Levora Site
        Scores, and detail panels are unlocked by request. Reach out and
        we&apos;ll enable full explorer access for your account.
      </p>
      <a
        href={`mailto:${contactEmail}?subject=Levora%20explorer%20access%20request`}
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-5 py-2.5 text-sm font-medium text-[var(--accent-bright)] transition-colors hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/15"
      >
        Contact {contactEmail}
        <span aria-hidden>→</span>
      </a>
      <p className="mt-6 max-w-xs text-[11px] leading-relaxed text-neutral-600">
        Include the email you signed up with so we can grant access to the
        right account.
      </p>
    </div>
  );
}
