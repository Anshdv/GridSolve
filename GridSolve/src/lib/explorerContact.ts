// Public contact address shown on the teaser "unlock" prompt.
export function getExplorerContactEmail(): string {
  return (
    process.env.NEXT_PUBLIC_EXPLORER_CONTACT_EMAIL?.trim().toLowerCase() ??
    "adevlekar@grid-solve.com"
  );
}
