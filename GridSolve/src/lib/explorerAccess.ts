// Which signed-in email gets full explorer access (list, scores, detail panels).
// Everyone else sees the map only and a contact prompt on the right.
export function getExplorerAccessEmail(): string {
  return (
    process.env.NEXT_PUBLIC_EXPLORER_ACCESS_EMAIL?.trim().toLowerCase() ??
    "ansh28.dev@gmail.com"
  );
}

// Public contact address shown on the teaser "unlock" prompt.
export function getExplorerContactEmail(): string {
  return (
    process.env.NEXT_PUBLIC_EXPLORER_CONTACT_EMAIL?.trim().toLowerCase() ??
    "deepslatelabs@gmail.com"
  );
}

export function hasExplorerFullAccess(
  userEmail: string | null | undefined
): boolean {
  if (!userEmail) return false;
  return userEmail.trim().toLowerCase() === getExplorerAccessEmail();
}
