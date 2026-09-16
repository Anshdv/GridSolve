"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export function useExplorerAccess() {
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true);
      return;
    }

    let cancelled = false;
    fetch("/api/explorer/access", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : { hasFullAccess: false }))
      .then((data: { hasFullAccess?: boolean }) => {
        if (cancelled) return;
        setHasFullAccess(Boolean(data.hasFullAccess));
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setHasFullAccess(false);
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ready,
    hasFullAccess,
  };
}
