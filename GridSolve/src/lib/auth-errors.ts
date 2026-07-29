import { isAuthError } from "@supabase/supabase-js";

const CODE_MESSAGES: Record<string, string> = {
  over_email_send_rate_limit:
    "Too many emails were sent recently. Please wait a few minutes and try again.",
  user_already_exists:
    "An account with this email already exists. Try signing in instead.",
  email_exists:
    "An account with this email already exists. Try signing in instead.",
  weak_password: "Please choose a stronger password.",
  signup_disabled: "New sign-ups are currently disabled.",
  email_provider_disabled: "Email sign-up is not available right now.",
  unexpected_failure:
    "We couldn't send your confirmation email. Please try again shortly.",
  invalid_credentials: "Email or password is incorrect.",
  email_not_confirmed:
    "Please confirm your email address before signing in. Check your inbox for the confirmation link.",
};

function isEmptyAuthMessage(message: string | undefined): boolean {
  if (!message) return true;
  const trimmed = message.trim();
  return trimmed === "" || trimmed === "{}";
}

/** Turn Supabase auth errors into user-facing copy (avoids raw `{}` from hook failures). */
export function formatAuthError(err: unknown): string {
  if (isAuthError(err)) {
    const raw = err.message?.trim();
    if (raw && !isEmptyAuthMessage(raw)) return raw;
    if (err.code && CODE_MESSAGES[err.code]) return CODE_MESSAGES[err.code];
    if (isEmptyAuthMessage(raw)) {
      return CODE_MESSAGES.unexpected_failure;
    }
  }

  if (err instanceof Error) {
    const raw = err.message?.trim();
    if (raw && !isEmptyAuthMessage(raw)) return raw;
  }

  return "Something went wrong. Try again.";
}
