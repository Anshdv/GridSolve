// Compact upgrade bar pinned below the preview list + detail. Kept slim so
// it never crowds the panel.
import Link from "next/link";

export default function TeaserContact({
  previewCount,
  total,
}: {
  previewCount: number;
  total: number;
}) {
  return (
    <div className="shrink-0 border-t border-white/10 bg-[var(--accent)]/[0.04] px-5 py-4 text-center">
      <p className="text-xs leading-relaxed text-neutral-400">
        Previewing <span className="text-neutral-200">{previewCount}</span> of{" "}
        <span className="text-neutral-200">{total.toLocaleString()}</span>{" "}
        substations — Power only. Screening unlocks the catalog for a live
        hunt; Diligence is the write-down (Risk, compare, print, CSV).
      </p>
      <Link
        href="/pricing"
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-2 text-xs font-medium text-[var(--accent-bright)] transition-colors hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/15"
      >
        See plans
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
