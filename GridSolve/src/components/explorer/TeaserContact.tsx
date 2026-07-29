// Shown when a session exists but full explorer access isn't available yet.
// Prompts the user to sign in with a complete account.
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
        substations — sign in to unlock the full list, filters, and comparisons.
      </p>
      <Link
        href="/signup"
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-2 text-xs font-medium text-[var(--accent-bright)] transition-colors hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/15"
      >
        Create a free account
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
