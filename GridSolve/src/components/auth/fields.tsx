"use client";

// Small shared building blocks for the auth forms — a labelled input, the
// primary submit button (with loading state), and inline error/notice
// messages. Kept minimal and consistent across login + reset-password.
import { forwardRef } from "react";

export const Field = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
>(function Field({ label, id, className = "", ...props }, ref) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-tele text-[11px] uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </span>
      <input
        ref={ref}
        id={id}
        className={`w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-neutral-400 hover:border-white/20 focus:border-[var(--accent)]/70 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
    </label>
  );
});

export function SubmitButton({
  loading,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || props.disabled}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_30px_-8px_rgba(61,123,255,0.6)] transition-colors hover:bg-[var(--accent-bright)] disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// `tone` = error (red) or notice (accent). Renders nothing when empty.
export function Message({
  tone,
  children,
}: {
  tone: "error" | "notice";
  children: React.ReactNode;
}) {
  if (!children) return null;
  const styles =
    tone === "error"
      ? "border-red-500/25 bg-red-500/[0.08] text-red-300"
      : "border-[var(--accent)]/25 bg-[var(--accent)]/[0.08] text-[var(--accent-bright)]";
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg border px-3 py-2.5 text-xs leading-relaxed ${styles}`}
    >
      {children}
    </div>
  );
}
