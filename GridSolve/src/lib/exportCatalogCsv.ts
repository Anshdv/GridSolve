import type { ScoredSubstation } from "@/lib/siteScore";
import type { TwoAxisScore } from "@/lib/scores";

function cell(value: string | number | null | undefined): string {
  if (value == null || value === "") return "";
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadCatalogCsv(
  rows: ScoredSubstation[],
  scoreOf: (s: ScoredSubstation) => TwoAxisScore,
  includeRisk: boolean
) {
  const headers = [
    "id",
    "name",
    "county",
    "state",
    "region",
    "queued_mw",
    "adjusted_mw",
    "median_network_cost_per_kw",
    "power",
    ...(includeRisk ? ["risk", "combined"] : []),
    "model_tier",
    "region_concordance",
    "exact_coords",
    "lat",
    "lng",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((s) => {
      const two = scoreOf(s);
      const cols = [
        s.id,
        s.name,
        s.county,
        s.state,
        s.region,
        s.queuedMw,
        s.adjustedMw,
        s.medianNetworkCostPerKw,
        two.powerScore,
        ...(includeRisk ? [two.riskScore, two.combined] : []),
        s.modelTier,
        s.regionConcordance,
        s.hasExactCoords ? "yes" : "no",
        s.lat,
        s.lng,
      ];
      return cols.map(cell).join(",");
    }),
  ];

  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gridsolve-substations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
