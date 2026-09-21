"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { PLAN_CAPABILITIES, type PlanCapabilities } from "@/lib/plans";

export function useExplorerAccess() {
  const [plan, setPlan] = useState<PlanCapabilities>(PLAN_CAPABILITIES.free);
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true);
      return;
    }

    let cancelled = false;
    fetch("/api/explorer/access", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data: { plan?: PlanCapabilities; authenticated?: boolean }) => {
        if (cancelled) return;
        setPlan(data.plan ?? PLAN_CAPABILITIES.free);
        setAuthenticated(Boolean(data.authenticated));
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setPlan(PLAN_CAPABILITIES.free);
        setAuthenticated(false);
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ready,
    plan,
    authenticated,
    hasFullAccess: plan.canSeeFullCatalog,
  };
}
