import { planForEmail, type PlanCapabilities } from "@/lib/plans";

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
  return planForEmail(userEmail).canSeeFullCatalog;
}

export function explorerPlanForEmail(
  userEmail: string | null | undefined
): PlanCapabilities {
  return planForEmail(userEmail);
}
