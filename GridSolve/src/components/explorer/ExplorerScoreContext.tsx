"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Substation } from "@/lib/data-meta";
import type { TwoAxisScore } from "@/lib/scores";

const ExplorerScoreContext = createContext<
  ((s: Substation) => TwoAxisScore) | null
>(null);

export function ExplorerScoreProvider({
  scoreOf,
  children,
}: {
  scoreOf: (s: Substation) => TwoAxisScore;
  children: ReactNode;
}) {
  return (
    <ExplorerScoreContext.Provider value={scoreOf}>
      {children}
    </ExplorerScoreContext.Provider>
  );
}

export function useExplorerScore() {
  const scoreOf = useContext(ExplorerScoreContext);
  if (!scoreOf) {
    throw new Error("useExplorerScore must be used within ExplorerScoreProvider");
  }
  return scoreOf;
}
