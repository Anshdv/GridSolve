"use client";

import { useEffect, useState } from "react";
import {
  checkPassword,
  PASSWORD_MIN_LENGTH,
  type PasswordChecks,
} from "@/lib/validation";
import { isPasswordPwned } from "@/lib/password-security";

const REQUIREMENTS: {
  key: keyof PasswordChecks;
  label: string;
}[] = [
  { key: "minLength", label: `At least ${PASSWORD_MIN_LENGTH} characters` },
  { key: "uppercase", label: "One uppercase letter (A–Z)" },
  { key: "lowercase", label: "One lowercase letter (a–z)" },
  { key: "number", label: "One number (0–9)" },
  { key: "symbol", label: "One symbol (!@#$…)" },
];

export function PasswordRequirements({
  password,
  checkBreaches = false,
}: {
  password: string;
  checkBreaches?: boolean;
}) {
  const checks = checkPassword(password);
  const metCount = Object.values(checks).filter(Boolean).length;
  const [pwned, setPwned] = useState<boolean | null>(null);

  useEffect(() => {
    if (!checkBreaches) return;
    if (!password || metCount < REQUIREMENTS.length) {
      setPwned(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      isPasswordPwned(password)
        .then((hit) => {
          if (!cancelled) setPwned(hit);
        })
        .catch(() => {
          if (!cancelled) setPwned(null);
        });
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [checkBreaches, password, metCount]);

  return (
    <div
      className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-3"
      aria-live="polite"
    >
      <p className="font-tele text-[10px] uppercase tracking-[0.14em] text-neutral-500">
        Password requirements
      </p>
      <ul className="mt-2.5 space-y-1.5">
        {REQUIREMENTS.map(({ key, label }) => (
          <RequirementItem key={key} met={checks[key]} label={label} />
        ))}
        {checkBreaches && password.length > 0 && metCount === REQUIREMENTS.length && (
          <RequirementItem
            met={pwned === false}
            label={
              pwned === true
                ? "Not found in known data breaches — choose another"
                : "Not found in known data breaches"
            }
          />
        )}
      </ul>
      {password.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 gap-1">
            {REQUIREMENTS.map(({ key }) => (
              <span
                key={key}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  checks[key] ? "bg-[var(--survive)]" : "bg-white/10"
                }`}
              />
            ))}
          </div>
          <span className="font-tele text-[10px] tabular-nums text-neutral-500">
            {metCount}/{REQUIREMENTS.length}
          </span>
        </div>
      )}
    </div>
  );
}

function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2 text-xs leading-snug">
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
          met
            ? "border-[var(--survive)]/40 bg-[var(--survive)]/15 text-[var(--survive)]"
            : "border-white/10 bg-white/[0.02] text-neutral-600"
        }`}
        aria-hidden
      >
        {met ? (
          <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6.5 5 9l4.5-5.5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <span className="h-1 w-1 rounded-full bg-neutral-600" />
        )}
      </span>
      <span className={met ? "text-neutral-300" : "text-neutral-500"}>
        {label}
      </span>
    </li>
  );
}
