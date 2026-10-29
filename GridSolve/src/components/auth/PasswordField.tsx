"use client";

import { forwardRef, useState } from "react";

export const PasswordField = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
>(function PasswordField({ label, id, className = "", disabled, ...props }, ref) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="mb-1.5 block font-tele text-[11px] uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </span>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          disabled={disabled}
          className={`w-full rounded-lg border border-white/10 bg-white/[0.03] py-2.5 pl-3 pr-10 text-sm text-white outline-none transition-colors placeholder:text-neutral-400 hover:border-white/20 focus:border-[var(--accent)]/70 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-500 transition-colors hover:text-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </label>
  );
});

function EyeIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M6.61 6.61A18.5 18.5 0 0 0 2 12s3.5 7 10 7a10.43 10.43 0 0 0 5.08-1.27" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}
