"use client";

import Link from "next/link";

export function TermsAgreement({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-3 transition-colors hover:border-white/10 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        required
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/[0.03] accent-[var(--accent)] focus:ring-[var(--accent)]/50 focus:ring-offset-0"
      />
      <span className="text-xs leading-relaxed text-neutral-400">
        I have read and agree to the{" "}
        <Link
          href="/terms"
          target="_blank"
          className="font-medium text-[var(--accent-bright)] underline decoration-[var(--accent)]/30 underline-offset-2 transition-colors hover:text-white"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          target="_blank"
          className="font-medium text-[var(--accent-bright)] underline decoration-[var(--accent)]/30 underline-offset-2 transition-colors hover:text-white"
        >
          Privacy Policy
        </Link>
        . I understand that GridSolve provides analytical estimates, not
        engineering or legal advice.
      </span>
    </label>
  );
}
