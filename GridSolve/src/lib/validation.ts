export const PASSWORD_MIN_LENGTH = 8;

export type PasswordChecks = {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  symbol: boolean;
};

export function checkPassword(password: string): PasswordChecks {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
}

export function isPasswordStrong(password: string): boolean {
  const checks = checkPassword(password);
  return Object.values(checks).every(Boolean);
}

export function getAgeFromDob(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export function isAtLeast18(dob: string): boolean {
  const age = getAgeFromDob(dob);
  return age !== null && age >= 18;
}

/** ISO date (YYYY-MM-DD) for the latest birthday that still makes the user 18. */
export function maxDobForAdult(today = new Date()): string {
  const d = new Date(today);
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0] ?? "";
}

export function hasAcceptedTerms(
  metadata: Record<string, unknown> | undefined
): boolean {
  return Boolean(metadata?.tos_accepted_at);
}

export function hasEnrolledMfa(
  metadata: Record<string, unknown> | undefined
): boolean {
  return Boolean(metadata?.mfa_enrolled_at);
}
