// Signed-in users with any email get full explorer access (list, scores, detail).
export function hasExplorerFullAccess(
  userEmail: string | null | undefined
): boolean {
  return Boolean(userEmail?.trim());
}
