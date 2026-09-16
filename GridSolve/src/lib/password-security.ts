// Have I Been Pwned k-anonymity check: only the first 5 chars of SHA-1 leave
// the device. Used on signup + password reset so leaked passwords are rejected.

export async function isPasswordPwned(password: string): Promise<boolean> {
  const digest = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(password)
  );
  const hash = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { "Add-Padding": "true" },
    cache: "no-store",
  });
  if (!res.ok) {
    // Fail open if HIBP is unreachable — still enforce local strength rules.
    return false;
  }
  const body = await res.text();
  return body.split("\n").some((line) => line.split(":")[0]?.trim() === suffix);
}
