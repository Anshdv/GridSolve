"""
Tune leakage-safe Cox models per ISO/RTO region and report held-out concordance.

The website currently publishes region concordance from an earlier PacifiCorp-style
feature set. Several regions were left unvalidated because those features are
missing there (no developer names, no cluster flag, no service type). This script
searches feature sets and Cox penalties that actually exist in each region.

Year-of-queue and proposed online date are excluded: q_year ranks calendar
cohorts (useless for scoring today's queue), and prop_date is often revised
after filing.

Protocol (same honesty rules as gridsolve_model.py):
  - Features knowable at/near queue entry only. Never IA_phase / q_status / wd_date.
  - Developer / county / entity history uses projects that RESOLVED before this
    project entered (no concurrent-fate leakage).
  - Score on MATURE projects (queued >= 2 years before as-of) via k-fold CV.
  - Pick a config on a light search, then re-estimate the winner with more seeds.

Usage:
    .venv/bin/python scripts/tune_concordance.py
    .venv/bin/python scripts/tune_concordance.py --apply
"""
from __future__ import annotations

import argparse
import json
import math
import sys
import traceback
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from lifelines import CoxPHFitter, WeibullAFTFitter
from lifelines.utils import concordance_index
from sklearn.model_selection import StratifiedKFold

warnings.filterwarnings("ignore")
pd.options.mode.chained_assignment = None

ROOT = Path(__file__).resolve().parents[1]
DATA_XLSX = ROOT / "data" / "LBNL_Ix_Queue_Data_File_thru2025.xlsx"
JSON_PATH = ROOT / "data" / "gridsolve.json"
RESULTS_PATH = ROOT / "data" / "concordance-tuning.json"
SHEET = "03. Complete Queue Data"
AS_OF = pd.Timestamp("2025-12-31")
PAC_STATES = {"OR", "WA", "ID", "UT", "WY"}

PUBLISHED = {
    "West": 0.617,
    "Southeast": 0.657,
    "PJM": 0.597,
    "MISO": None,
    "CAISO": 0.514,
    "ISO-NE": 0.651,
    "SPP": None,
    "NYISO": None,
    "ERCOT": None,
    "PacifiCorp": 0.718,
}

FEATURE_SETS = {
    "baseline": [
        "mw_log", "solar", "wind", "battery", "gas",
        "nris", "in_cluster", "third_party_dev", "dev_hist", "has_dev_hist",
    ],
    "tech_queue": [
        "mw_log", "solar", "wind", "battery", "gas", "hybrid",
        "storage_only", "in_cluster", "nris", "eris",
    ],
    "plus_depths": [
        "mw_log", "solar", "wind", "battery", "gas", "hybrid",
        "storage_only", "in_cluster", "nris", "eris",
        "poi_depth_log", "county_depth_log",
    ],
    "plus_history": [
        "mw_log", "solar", "wind", "battery", "gas", "hybrid",
        "storage_only", "in_cluster", "nris", "eris",
        "poi_depth_log", "county_depth_log",
        "county_hist", "has_county_hist",
        "entity_hist", "has_entity_hist",
        "util_hist", "has_util_hist",
        "dev_hist", "has_dev_hist", "n_prior_dev_log",
        "third_party_dev", "has_developer",
        "x_cluster_battery", "x_hybrid_mw",
    ],
}

DRIVER_LABELS = {
    "in_cluster": "In cluster process",
    "third_party_dev": "Third-party developer",
    "nris": "NRIS service",
    "eris": "ERIS service",
    "battery": "Battery",
    "hybrid": "Hybrid / co-located",
    "solar": "Solar",
    "wind": "Wind",
    "gas": "Gas",
    "storage_only": "Storage-only",
    "poi_depth_log": "Existing POI queue depth",
    "dev_hist": "Developer prior withdrawal rate",
    "county_hist": "County prior withdrawal rate",
    "util_hist": "Utility prior withdrawal rate",
    "n_prior_dev_log": "Repeat developer",
    "has_developer": "Named developer",
    "x_cluster_battery": "Cluster × battery",
}


def load_queue(path: Path) -> pd.DataFrame:
    df = pd.read_excel(path, sheet_name=SHEET, header=1)
    for c in ["q_date", "wd_date", "ia_date", "on_date", "prop_date"]:
        df[c] = pd.to_datetime(df[c], errors="coerce")
    df = df[df["q_date"].notna()].copy()
    df["q_year"] = df["q_year"].fillna(df["q_date"].dt.year)
    df["event"] = (df["q_status"] == "withdrawn").astype(int)
    df["duration"] = (AS_OF - df["q_date"]).dt.days / 30.44
    wd_dur = (df["wd_date"] - df["q_date"]).dt.days / 30.44
    wd_mask = (df["event"] == 1) & df["wd_date"].notna()
    df.loc[wd_mask, "duration"] = wd_dur[wd_mask]
    df = df[(df["duration"] > 0) & (df["duration"] < 180)].copy()
    df["resolve_date"] = pd.to_datetime(
        np.where((df["event"] == 1) & df["wd_date"].notna(), df["wd_date"], AS_OF)
    )
    return df.reset_index(drop=True)


def _asof_prior_rate(df: pd.DataFrame, group_col: str, default: float, min_n: int = 2):
    src = df[[group_col, "resolve_date", "event"]].dropna(subset=[group_col, "resolve_date"]).copy()
    src[group_col] = src[group_col].astype(str)
    src = src.sort_values("resolve_date")
    src["n"] = src.groupby(group_col).cumcount() + 1
    src["s"] = src.groupby(group_col)["event"].cumsum()
    src = src.rename(columns={"resolve_date": "t"})

    left = df[[group_col, "q_date"]].copy()
    left["_row"] = df.index
    left[group_col] = left[group_col].astype(str)
    left = left.dropna(subset=[group_col, "q_date"])

    merged = pd.merge_asof(
        left.sort_values("q_date"),
        src.sort_values("t"),
        left_on="q_date",
        right_on="t",
        by=group_col,
        allow_exact_matches=False,
        direction="backward",
    )
    rate = pd.Series(default, index=df.index, dtype=float)
    has = pd.Series(0, index=df.index, dtype=int)
    ok = merged["n"].fillna(0) >= min_n
    idx = merged.loc[ok, "_row"]
    rate.loc[idx] = (merged.loc[ok, "s"] / merged.loc[ok, "n"]).to_numpy()
    has.loc[idx] = 1
    return rate, has


def _asof_prior_count(df: pd.DataFrame, group_col: str):
    src = df[[group_col, "q_date"]].dropna().copy()
    src[group_col] = src[group_col].astype(str)
    src = src.sort_values("q_date")
    src["n"] = src.groupby(group_col).cumcount()  # priors only (not including self)
    # After sorting, n is the count of earlier q_dates in the group; assign back
    out = pd.Series(0.0, index=df.index)
    out.loc[src.index] = src["n"].astype(float)
    return out


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    t = df["type_clean"].astype(str)
    t1 = df["type_1"].astype(str)
    svc = df["service"].astype(str)
    util = df["utility"].astype(str)
    entity = df["entity"].astype(str)
    dev = df["developer"].astype(str)

    df["mw"] = pd.to_numeric(df["mw_1"], errors="coerce")
    df["mw"] = df["mw"].clip(upper=df["mw"].quantile(0.99))
    df["mw_log"] = np.log1p(df["mw"].fillna(df["mw"].median()))
    df["solar"] = t.str.contains("Solar", na=False).astype(int)
    df["wind"] = t.str.contains("Wind", na=False).astype(int)
    df["battery"] = t.str.contains("Battery", na=False).astype(int)
    df["gas"] = t.str.contains("Gas", na=False).astype(int)
    df["hybrid"] = (
        df["type_2"].notna() | t.str.contains(r"\+", na=False)
    ).astype(int)
    df["storage_only"] = (t1 == "Battery").astype(int)
    df["offshore"] = t.str.contains("Offshore", na=False).astype(int)
    df["nris"] = svc.str.contains("NRIS", na=False).astype(int)
    df["eris"] = (svc == "ERIS").astype(int)
    df["service_missing"] = df["service"].isna().astype(int)
    df["in_cluster"] = df["cluster"].notna().astype(int)
    df["cluster_missing"] = df["cluster"].isna().astype(int)
    df["has_developer"] = df["developer"].notna().astype(int)
    df["third_party_dev"] = (
        df["developer"].notna()
        & ~dev.str.lower().eq(util.str.lower())
        & ~dev.str.lower().eq(entity.str.lower())
        & ~dev.str.contains("pacificorp", case=False, na=False)
    ).astype(int)
    df["q_year_c"] = (df["q_year"] - 2019).clip(-10, 10)
    horizon = (df["prop_date"] - df["q_date"]).dt.days / 365.25
    df["prop_missing"] = df["prop_date"].isna().astype(int)
    med_h = horizon.median()
    if not np.isfinite(med_h):
        med_h = 3.0
    df["prop_horizon"] = horizon.clip(lower=0, upper=12).fillna(med_h)

    base_wd = float(df["event"].mean())
    df["county_key"] = df["county"].astype(str) + "|" + df["state"].astype(str)
    df["entity_key"] = df["entity"].astype(str)
    df["dev_key"] = np.where(df["developer"].notna(), df["developer"].astype(str), np.nan)
    df["poi_key"] = np.where(df["poi_name"].notna(), df["poi_name"].astype(str) + "|" + df["state"].astype(str), np.nan)

    df["county_hist"], df["has_county_hist"] = _asof_prior_rate(df, "county_key", base_wd)
    df["entity_hist"], df["has_entity_hist"] = _asof_prior_rate(df, "entity_key", base_wd)
    df["util_key"] = np.where(df["utility"].notna(), df["utility"].astype(str), df["entity"].astype(str))
    df["util_hist"], df["has_util_hist"] = _asof_prior_rate(df, "util_key", base_wd)
    df["dev_hist"], df["has_dev_hist"] = _asof_prior_rate(
        df.assign(dev_key=df["dev_key"].fillna("__none__")), "dev_key", base_wd
    )
    df.loc[df["developer"].isna(), ["dev_hist", "has_dev_hist"]] = (base_wd, 0)

    df["n_prior_dev"] = _asof_prior_count(df.assign(dev_key=df["dev_key"].fillna("__none__")), "dev_key")
    df.loc[df["developer"].isna(), "n_prior_dev"] = 0
    df["n_prior_dev_log"] = np.log1p(df["n_prior_dev"])
    df["poi_depth"] = _asof_prior_count(df.assign(poi_key=df["poi_key"].fillna("__none__")), "poi_key")
    df.loc[df["poi_name"].isna(), "poi_depth"] = 0
    df["poi_depth_log"] = np.log1p(df["poi_depth"])
    df["county_depth"] = _asof_prior_count(df, "county_key")
    df["county_depth_log"] = np.log1p(df["county_depth"])

    df["x_cluster_battery"] = df["in_cluster"] * df["battery"]
    df["x_hybrid_mw"] = df["hybrid"] * df["mw_log"]
    df["x_nris_solar"] = df["nris"] * df["solar"]
    df["x_year_battery"] = df["q_year_c"] * df["battery"]
    df["is_pacificorp"] = (
        entity.str.contains("PacifiCorp", case=False, na=False)
        | util.str.contains("PacifiCorp", case=False, na=False)
    ).astype(int)
    return df


def usable_features(frame: pd.DataFrame, feats: list[str]) -> list[str]:
    keep = []
    for f in feats:
        if f not in frame.columns:
            continue
        s = frame[f]
        if s.nunique(dropna=True) < 2:
            continue
        if s.std(skipna=True) < 1e-8:
            continue
        # drop nearly-empty binaries
        pos = float((s.fillna(0) > 0).mean())
        if pos < 0.02 or pos > 0.98:
            if s.nunique() <= 2:
                continue
        keep.append(f)
    return keep


def fit_score(train, test, feats, penalizer, l1_ratio, model="cox"):
    cols = ["duration", "event"] + feats
    tr = train[cols].dropna()
    te = test[cols].dropna()
    if len(tr) < 40 or te["event"].sum() < 8 or tr["event"].sum() < 12:
        return None
    try:
        if model == "cox":
            m = CoxPHFitter(penalizer=penalizer, l1_ratio=l1_ratio)
            m.fit(tr, "duration", "event")
            risk = m.predict_partial_hazard(te)
            return float(concordance_index(te["duration"], -risk, te["event"]))
        m = WeibullAFTFitter(penalizer=penalizer)
        m.fit(tr, "duration", "event")
        mu = m.predict_median(te)
        return float(concordance_index(te["duration"], mu, te["event"]))
    except Exception:
        return None


def cv_mean(frame, feats, penalizer=0.1, l1_ratio=0.0, n_splits=5, seeds=(1,), model="cox"):
    mature = frame.reset_index(drop=True)
    if len(mature) < 60 or mature["event"].sum() < 25:
        return None, []
    n_splits = int(min(n_splits, max(2, mature["event"].sum() // 10)))
    if n_splits < 2:
        return None, []
    per_seed = []
    for seed in seeds:
        kf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=seed)
        fold_scores = []
        try:
            splits = kf.split(mature, mature["event"])
        except ValueError:
            return None, []
        for tr_i, te_i in splits:
            sc = fit_score(
                mature.iloc[tr_i], mature.iloc[te_i], feats,
                penalizer, l1_ratio, model=model,
            )
            if sc is not None:
                fold_scores.append(sc)
        if fold_scores:
            per_seed.append(float(np.mean(fold_scores)))
    if not per_seed:
        return None, []
    return float(np.mean(per_seed)), per_seed


def area_frame(df, name, era_start, mature_max):
    sub = df[(df["q_year"] >= era_start) & (df["q_year"] <= mature_max)].copy()
    if name == "PacifiCorp":
        sub = sub[sub["is_pacificorp"] == 1]
    elif name == "West_other":
        sub = sub[(sub["region"] == "West") & (sub["is_pacificorp"] == 0)]
    else:
        sub = sub[sub["region"] == name]
    return sub


def search_area(df, name):
    print(f"\n{'=' * 64}\n{name}\n{'=' * 64}", flush=True)
    candidates = []
    frames = {era: area_frame(df, name, era, AS_OF.year - 2) for era in (2019,)}
    for era, frame in frames.items():
        for feat_name, feat_list in FEATURE_SETS.items():
            feats = usable_features(frame, feat_list)
            if len(feats) < 3:
                continue
            mean, _ = cv_mean(frame, feats, penalizer=0.1, seeds=(7,), n_splits=3)
            if mean is None:
                continue
            rec = {
                "area": name,
                "era": era,
                "features": feat_name,
                "n_feats": len(feats),
                "feat_list": feats,
                "penalizer": 0.1,
                "l1_ratio": 0.0,
                "model": "cox",
                "n": int(len(frame)),
                "events": int(frame["event"].sum()),
                "cv": round(mean, 4),
            }
            candidates.append(rec)
            print(f"  era={era} {feat_name:<14} n={rec['n']:<5} ev={rec['events']:<5} "
                  f"k={len(feats):<2}  c={mean:.3f}", flush=True)

    if not candidates:
        print("  no viable model", flush=True)
        return None

    candidates.sort(key=lambda r: r["cv"], reverse=True)
    shortlist = candidates[:2]

    # refine top configs
    refined = []
    for base in shortlist:
        frame = frames[base["era"]]
        feats = base["feat_list"]
        for pen in (0.05, 0.1, 0.3):
            for l1 in (0.0, 0.5):
                mean, _ = cv_mean(
                    frame, feats, penalizer=pen, l1_ratio=l1,
                    seeds=(7,), n_splits=3,
                )
                if mean is None:
                    continue
                rec = dict(base)
                rec.update({"penalizer": pen, "l1_ratio": l1, "cv": round(mean, 4), "model": "cox"})
                refined.append(rec)
        if base["cv"] < 0.60:
            mean, _ = cv_mean(
                frame, feats, penalizer=0.1, seeds=(7,), n_splits=3, model="aft"
            )
            if mean is not None:
                rec = dict(base)
                rec.update({"penalizer": 0.1, "l1_ratio": 0.0, "cv": round(mean, 4), "model": "aft"})
                refined.append(rec)

    pool = refined or candidates
    pool.sort(key=lambda r: r["cv"], reverse=True)
    winner = pool[0]

    # confirm winner with more seeds
    frame = frames[winner["era"]]
    feats = winner["feat_list"]
    mean, seeds = cv_mean(
        frame, feats,
        penalizer=winner["penalizer"],
        l1_ratio=winner.get("l1_ratio", 0.0),
        seeds=(3, 7, 19, 29, 101),
        n_splits=5,
        model=winner["model"],
    )
    winner["cv_confirmed"] = None if mean is None else round(mean, 4)
    winner["cv_std"] = None if not seeds else round(float(np.std(seeds)), 4)
    winner["seed_scores"] = [round(s, 4) for s in seeds]
    print(f"  WINNER {winner['model']} {winner['features']} era={winner['era']} "
          f"pen={winner['penalizer']} l1={winner['l1_ratio']}  "
          f"confirmed={winner['cv_confirmed']} ± {winner['cv_std']}", flush=True)
    return winner


def pooled_per_region(df, spec):
    """Train one national model (region-aware features) and score each region held-out."""
    era = spec["era"]
    feats = spec["feat_list"]
    mature = df[(df["q_year"] >= era) & (df["q_year"] <= AS_OF.year - 2)].copy()
    # add region one-hots
    dummies = pd.get_dummies(mature["region"], prefix="reg", drop_first=True)
    dummy_cols = list(dummies.columns)
    mature = pd.concat([mature.reset_index(drop=True), dummies.reset_index(drop=True)], axis=1)
    all_feats = usable_features(mature, feats + dummy_cols)
    kf = StratifiedKFold(n_splits=5, shuffle=True, random_state=7)
    acc = {r: [] for r in PUBLISHED if r not in ("PacifiCorp", "West_other")}
    acc["PacifiCorp"] = []
    for tr_i, te_i in kf.split(mature, mature["event"]):
        tr, te = mature.iloc[tr_i], mature.iloc[te_i]
        try:
            m = CoxPHFitter(penalizer=spec["penalizer"], l1_ratio=spec.get("l1_ratio", 0.0))
            m.fit(tr[["duration", "event"] + all_feats].dropna(), "duration", "event")
        except Exception:
            continue
        for area, mask in [
            *[(r, te["region"] == r) for r in acc if r != "PacifiCorp"],
            ("PacifiCorp", te["is_pacificorp"] == 1),
        ]:
            part = te[mask]
            if part["event"].sum() < 8:
                continue
            try:
                risk = m.predict_partial_hazard(part)
                acc[area].append(float(concordance_index(part["duration"], -risk, part["event"])))
            except Exception:
                continue
    out = {}
    for k, v in acc.items():
        out[k] = None if not v else round(float(np.mean(v)), 4)
    return out, all_feats


def fit_full(frame, feats, penalizer, l1_ratio, model="cox"):
    cols = ["duration", "event"] + feats
    tr = frame[cols].dropna()
    if model == "aft":
        m = WeibullAFTFitter(penalizer=penalizer)
        m.fit(tr, "duration", "event")
        return m
    m = CoxPHFitter(penalizer=penalizer, l1_ratio=l1_ratio)
    m.fit(tr, "duration", "event")
    return m


def tier_for(c):
    if c is None:
        return "unvalidated"
    if c >= 0.70:
        return "validated"
    if c >= 0.63:
        return "usable"
    if c >= 0.60:
        return "marginal"
    if c >= 0.55:
        return "weak"
    return "not_predictive"


def drivers_from_model(model, feats):
    if not hasattr(model, "hazard_ratios_"):
        return []
    rows = []
    hrs = model.hazard_ratios_
    for f in feats:
        if f not in hrs.index or f.startswith("reg_") or f.startswith("has_"):
            continue
        hr = float(hrs[f])
        if not math.isfinite(hr) or abs(math.log(hr + 1e-12)) < 0.05:
            continue
        rows.append((abs(math.log(hr)), f, hr))
    rows.sort(reverse=True)
    out = []
    for _, f, hr in rows[:6]:
        out.append({
            "feature": DRIVER_LABELS.get(f, f.replace("_", " ").title()),
            "hazard_ratio": round(hr, 2),
        })
    return out


def apply_to_json(winners, pac_c, drivers):
    raw = json.loads(JSON_PATH.read_text())
    west_src = winners.get("West_other") or winners.get("West")
    region_validation = {}
    for region in [
        "West", "Southeast", "PJM", "MISO", "CAISO",
        "ISO-NE", "SPP", "NYISO", "ERCOT",
    ]:
        w = west_src if region == "West" else winners.get(region)
        c = None if not w else w.get("cv_confirmed")
        region_validation[region] = {
            "concordance": None if c is None else round(float(c), 3),
            "tier": tier_for(None if c is None else float(c)),
        }
    raw["model"]["region_validation"] = region_validation
    raw["model"]["pacificorp_concordance"] = round(float(pac_c), 3) if pac_c else raw["model"].get("pacificorp_concordance")
    raw["model"]["note"] = (
        "Withdrawal rates are EMPIRICAL, computed within each region from that "
        "region's own resolved projects. They are observed history, not model "
        "extrapolation. Survival-model concordance was validated per region "
        "(leakage-safe Cox, mature-project cross-validation) and differs widely "
        "— see model_tier on each substation."
    )
    if drivers:
        raw["drivers"] = drivers

    pac_tier = tier_for(None if pac_c is None else float(pac_c))
    for s in raw["substations"]:
        region = s.get("region")
        if region == "West" and s.get("state") in PAC_STATES and pac_c is not None:
            s["region_concordance"] = round(float(pac_c), 3)
            s["model_tier"] = pac_tier
        else:
            v = region_validation.get(region, {"concordance": None, "tier": "unvalidated"})
            s["region_concordance"] = v["concordance"]
            s["model_tier"] = v["tier"]

    JSON_PATH.write_text(json.dumps(raw, separators=(",", ":")))
    print(f"Updated {JSON_PATH}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Write winning concordance into gridsolve.json")
    args = parser.parse_args()

    if not DATA_XLSX.exists():
        sys.exit(f"Missing {DATA_XLSX}")

    print("Loading LBNL queue file…", flush=True)
    df = load_queue(DATA_XLSX)
    print(f"  {len(df):,} projects after duration filter", flush=True)
    df = build_features(df)
    print("  features built", flush=True)

    areas = [
        "PacifiCorp", "West", "West_other", "CAISO", "ERCOT", "SPP",
        "MISO", "PJM", "Southeast", "NYISO", "ISO-NE",
    ]
    winners = {}
    for name in areas:
        try:
            w = search_area(df, name)
        except Exception:
            traceback.print_exc()
            w = None
        if w:
            winners[name] = w

    # Pooled national model using the most common winning feature set
    print("\n" + "=" * 64)
    print("POOLED national model, scored per region")
    print("=" * 64)
    pooled_spec = winners.get("West") or next(iter(winners.values()), None)
    pooled_scores = {}
    pooled_feats = []
    if pooled_spec:
        # prefer 'full' if it was viable anywhere
        full_like = None
        for w in winners.values():
            if w["features"] in ("plus_history", "plus_depths", "tech_queue"):
                full_like = w
                break
        spec = dict(full_like or pooled_spec)
        spec["feat_list"] = FEATURE_SETS.get(spec["features"], spec["feat_list"])
        try:
            pooled_scores, pooled_feats = pooled_per_region(df, spec)
            for k, v in pooled_scores.items():
                print(f"  pooled {k:<12} {v}")
        except Exception:
            traceback.print_exc()

    # If pooled beats the local model, take it (still held-out)
    for area, local in list(winners.items()):
        p = pooled_scores.get(area)
        if p is not None and local.get("cv_confirmed") is None:
            print(f"  using POOLED for {area}: {p:.3f} (no local model)")
            winners[area] = dict(local) if local else {"area": area, "features": "pooled"}
            winners[area]["cv_confirmed"] = p
            winners[area]["source"] = "pooled"
        else:
            winners[area]["source"] = "local"

    print("\n" + "=" * 64)
    print(f"{'Area':<12} {'was':>6} {'now':>6} {'Δ':>6}  {'tier':<14} source / spec")
    print("=" * 64)
    summary = {}
    for area in areas:
        w = winners.get(area)
        old = PUBLISHED.get(area)
        new = None if not w else w.get("cv_confirmed")
        delta = ""
        if old is not None and new is not None:
            delta = f"{new - old:+.3f}"
        elif new is not None:
            delta = " new"
        print(
            f"{area:<12} {old if old is not None else '—':>6} "
            f"{new if new is not None else '—':>6} {delta:>6}  "
            f"{tier_for(new):<14} "
            f"{(w or {}).get('source', ''):<6} {(w or {}).get('features', '')} "
            f"era={(w or {}).get('era', '')} pen={(w or {}).get('penalizer', '')}"
        )
        summary[area] = w

    # National drivers from a pooled Cox on 2019+ mature
    drivers = []
    try:
        feats = usable_features(
            df[(df["q_year"] >= 2019) & (df["q_year"] <= AS_OF.year - 2)],
            FEATURE_SETS["plus_history"],
        )
        nat = df[(df["q_year"] >= 2019) & (df["q_year"] <= AS_OF.year - 2)]
        model = fit_full(nat, feats, penalizer=0.1, l1_ratio=0.0)
        drivers = drivers_from_model(model, feats)
        print("\nNational drivers (pooled Cox):")
        for d in drivers:
            print(f"  {d['feature']:<32} HR {d['hazard_ratio']}")
    except Exception:
        traceback.print_exc()

    payload = {
        "winners": {
            k: {kk: vv for kk, vv in w.items() if kk != "feat_list"} | {"feat_list": w.get("feat_list")}
            for k, w in winners.items()
        },
        "pooled_scores": pooled_scores,
        "drivers": drivers,
    }
    RESULTS_PATH.write_text(json.dumps(payload, indent=2))
    print(f"\nWrote {RESULTS_PATH}")

    if args.apply:
        pac = winners.get("PacifiCorp", {}).get("cv_confirmed")
        apply_to_json(winners, pac, drivers)


if __name__ == "__main__":
    main()
