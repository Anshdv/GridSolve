// Which signed-in email gets full explorer access (list, scores, detail panels).
// Server-only — never import this from a Client Component.
export function getExplorerAccessEmail(): string {
  return (
    process.env.EXPLORER_ACCESS_EMAIL?.trim().toLowerCase() ||
    process.env.NEXT_PUBLIC_EXPLORER_ACCESS_EMAIL?.trim().toLowerCase() ||
    "ansh28.dev@gmail.com"
  );
}

export function hasExplorerFullAccess(
  userEmail: string | null | undefined
): boolean {
  if (!userEmail) return false;
  return userEmail.trim().toLowerCase() === getExplorerAccessEmail();
}
