import type { ScoredSubstation } from "@/lib/siteScore";
import { scoreTerciles } from "@/lib/siteScore";

export function buildTeaserSubstations(
  scored: ScoredSubstation[],
  nationalTerciles: [number, number]
): ScoredSubstation[] {
  const [t0, t1] = nationalTerciles;
  const siteScore = (s: ScoredSubstation) => s.scoreResult?.score ?? -1;

  const isRealSubstation = (name: string) =>
    name.toLowerCase().includes("substation") && !/\s[-–]\s/.test(name);

  const EXCLUDED_STATES = new Set(["KS"]);

  const poolCandidates = scored.filter(
    (s) =>
      s.scoreResult != null &&
      s.hasExactCoords &&
      isRealSubstation(s.name) &&
      !EXCLUDED_STATES.has(s.state)
  );
  const rich = poolCandidates.filter(
    (s) => s.medianNetworkCostPerKw != null && s.histWithdrawRate != null
  );
  const pool = rich.length >= 18 ? rich : poolCandidates;

  const usedRegions = new Set<string>();
  const chosen: ScoredSubstation[] = [];
  const take = (
    candidates: ScoredSubstation[],
    n: number,
    diverse = true
  ) => {
    let count = 0;
    if (diverse) {
      for (const s of candidates) {
        if (count >= n) break;
        if (chosen.includes(s) || usedRegions.has(s.region)) continue;
        chosen.push(s);
        usedRegions.add(s.region);
        count++;
      }
    }
    for (const s of candidates) {
      if (count >= n) break;
      if (chosen.includes(s)) continue;
      chosen.push(s);
      usedRegions.add(s.region);
      count++;
    }
  };

  const mid = (t0 + t1) / 2;
  const good = pool
    .filter((s) => siteScore(s) > t1)
    .sort((a, b) => siteScore(b) - siteScore(a));
  const bad = pool
    .filter((s) => siteScore(s) <= t0)
    .sort((a, b) => siteScore(a) - siteScore(b));
  const medium = pool
    .filter((s) => siteScore(s) > t0 && siteScore(s) <= t1)
    .sort(
      (a, b) => Math.abs(siteScore(a) - mid) - Math.abs(siteScore(b) - mid)
    );

  take(good, 2);
  take(medium, 2);
  take(bad, 2, false);

  if (chosen.length < 6) {
    const rest = pool
      .filter((s) => !chosen.includes(s))
      .sort((a, b) => siteScore(b) - siteScore(a));
    for (const s of rest) {
      if (chosen.length >= 6) break;
      chosen.push(s);
    }
  }
  return chosen.slice(0, 6);
}

export function buildInitialBounds(
  mapped: ScoredSubstation[]
): [[number, number], [number, number]] {
  const lats = mapped.map((s) => s.lat as number);
  const lngs = mapped.map((s) => s.lng as number);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

export function buildNationalTerciles(
  scored: ScoredSubstation[]
): [number, number] {
  return scoreTerciles(
    scored.map((s) => s.scoreResult?.score).filter((n): n is number => n != null)
  );
}
