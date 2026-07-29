// Compact contact-to-unlock bar pinned below the preview list + detail. Kept
// slim so it never crowds the panel. Email is the configured explorer-access
// address (single source of truth).
import { getExplorerAccessEmail } from "@/lib/explorerAccess";

export default function TeaserContact({
  previewCount,
  total,
}: {
  previewCount: number;
  total: number;
}) {
  const email = getExplorerAccessEmail();

  return (
    <div className="shrink-0 border-t border-white/10 bg-[var(--accent)]/[0.04] px-5 py-4 text-center">
      <p className="text-xs leading-relaxed text-neutral-400">
        Previewing <span className="text-neutral-200">{previewCount}</span> of{" "}
        <span className="text-neutral-200">{total.toLocaleString()}</span>{" "}
        substations — the full list, filters, and comparisons are unlocked by
        request.
      </p>
      <a
        href={`mailto:${email}?subject=GridSolve%20explorer%20access%20request`}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-2 text-xs font-medium text-[var(--accent-bright)] transition-colors hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/15"
      >
        Contact {email} to unlock all
        <span aria-hidden>→</span>
      </a>
    </div>
  );
}
