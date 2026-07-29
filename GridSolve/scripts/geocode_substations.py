#!/usr/bin/env python3
"""
Re-geocode substations in data/gridsolve.json.

Sources (in priority order):
  1. Preserve 6 curated teaser preview sites (known-good coordinates)
  2. HIFLD electric substation inventory (fuzzy name + state match)
  3. Google Geocoding API (if GOOGLE_MAPS_API_KEY is set)
  4. OpenStreetMap Nominatim
  5. Photon (Komoot)
  6. County/parish centroid (coord_precision = "county") as last resort

Resumable via data/geocode-cache.json.

Usage:
  python3 scripts/geocode_substations.py
  python3 scripts/geocode_substations.py --dry-run
  python3 scripts/geocode_substations.py --limit 100
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "gridsolve.json"
HIFLD_CACHE = ROOT / "data" / "hifld_substations_us.json"
GEO_CACHE = ROOT / "data" / "geocode-cache.json"
REPORT_PATH = ROOT / "data" / "geocode-report.json"

TEASER_INDICES = {705, 7, 221, 273, 4154, 2967}

DRY_RUN = "--dry-run" in sys.argv
LIMIT = None
for i, arg in enumerate(sys.argv):
    if arg == "--limit" and i + 1 < len(sys.argv):
        LIMIT = int(sys.argv[i + 1])

NOMINATIM_DELAY = 1.1
OTHER_DELAY = 0.35

STATE_BOUNDS = {
    "AL": ((30.1, 35.0), (-88.5, -84.9)),
    "AR": ((33.0, 36.5), (-94.6, -89.6)),
    "AZ": ((31.3, 37.0), (-114.8, -109.0)),
    "CA": ((32.5, 42.0), (-124.5, -114.1)),
    "CO": ((37.0, 41.0), (-109.1, -102.0)),
    "CT": ((41.0, 42.1), (-73.7, -71.8)),
    "DC": ((38.79, 38.99), (-77.12, -76.91)),
    "DE": ((38.45, 39.84), (-75.79, -75.05)),
    "FL": ((24.5, 31.0), (-87.6, -80.0)),
    "GA": ((30.4, 35.0), (-85.6, -80.8)),
    "IA": ((40.4, 43.5), (-96.6, -90.1)),
    "ID": ((42.0, 49.0), (-117.2, -111.0)),
    "IL": ((37.0, 42.5), (-91.5, -87.5)),
    "IN": ((37.8, 41.8), (-88.1, -84.8)),
    "KS": ((37.0, 40.0), (-102.1, -94.6)),
    "KY": ((36.5, 39.2), (-89.6, -82.0)),
    "LA": ((29.0, 33.0), (-94.0, -89.0)),
    "MA": ((41.2, 42.9), (-73.5, -69.9)),
    "MD": ((37.9, 39.7), (-79.5, -75.0)),
    "ME": ((43.0, 47.5), (-71.1, -66.9)),
    "MI": ((41.7, 48.3), (-90.4, -82.4)),
    "MN": ((43.5, 49.4), (-97.2, -89.5)),
    "MO": ((36.0, 40.6), (-95.8, -89.1)),
    "MS": ((30.2, 35.0), (-91.7, -88.1)),
    "MT": ((44.4, 49.0), (-116.1, -104.0)),
    "NC": ((33.8, 36.6), (-84.3, -75.5)),
    "ND": ((45.9, 49.0), (-104.1, -96.6)),
    "NE": ((40.0, 43.0), (-104.1, -95.3)),
    "NH": ((42.7, 45.3), (-72.6, -70.6)),
    "NJ": ((38.9, 41.4), (-75.6, -73.9)),
    "NM": ((31.3, 37.0), (-109.1, -103.0)),
    "NV": ((35.0, 42.0), (-120.0, -114.0)),
    "NY": ((40.5, 45.0), (-79.8, -71.9)),
    "OH": ((38.4, 42.0), (-84.8, -80.5)),
    "OK": ((33.6, 37.0), (-103.0, -94.4)),
    "OR": ((42.0, 46.3), (-124.6, -116.5)),
    "PA": ((39.7, 42.3), (-80.5, -74.7)),
    "RI": ((41.1, 42.0), (-71.9, -71.1)),
    "SC": ((32.0, 35.2), (-83.4, -78.5)),
    "SD": ((42.5, 45.9), (-104.1, -96.4)),
    "TN": ((35.0, 36.7), (-90.3, -81.6)),
    "TX": ((25.8, 36.5), (-106.6, -93.5)),
    "UT": ((37.0, 42.0), (-114.1, -109.0)),
    "VA": ((36.5, 39.5), (-83.7, -75.2)),
    "VT": ((42.7, 45.0), (-73.4, -71.5)),
    "WA": ((45.5, 49.0), (-124.8, -116.9)),
    "WI": ((42.5, 47.1), (-92.9, -86.8)),
    "WV": ((37.2, 40.6), (-82.6, -77.7)),
    "WY": ((41.0, 45.0), (-111.1, -104.0)),
    "MX": ((14.5, 32.7), (-118.4, -86.7)),
}

STATE_NAMES = {
    "AL": "Alabama", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida",
    "GA": "Georgia", "IA": "Iowa", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "MA": "Massachusetts",
    "MD": "Maryland", "ME": "Maine", "MI": "Michigan", "MN": "Minnesota",
    "MO": "Missouri", "MS": "Mississippi", "MT": "Montana", "NC": "North Carolina",
    "ND": "North Dakota", "NE": "Nebraska", "NH": "New Hampshire", "NJ": "New Jersey",
    "NM": "New Mexico", "NV": "Nevada", "NY": "New York", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VA": "Virginia",
    "VT": "Vermont", "WA": "Washington", "WI": "Wisconsin", "WV": "West Virginia", "WY": "Wyoming",
}


def norm_text(s: str) -> str:
    s = (s or "").lower()
    s = re.sub(r"\([^)]*\)", " ", s)
    s = re.sub(r"\d+\.?\d*\s*kv", " ", s, flags=re.I)
    s = re.sub(
        r"\b(substation|switching station|switchyard|sub\.?|ss\b|yard|ehv|tap|new|existing|proposed)\b",
        " ",
        s,
        flags=re.I,
    )
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def norm_county(s: str) -> str:
    return norm_text(s).replace(" parish", "").replace(" county", "").replace(" co", "").strip()


def tokens(s: str) -> set[str]:
    return {w for w in norm_text(s).split() if len(w) > 2}


def primary_name(name: str) -> str:
    name = re.sub(r"\([^)]*\)", " ", name)
    m = re.match(r"^(.+?)\s[-–—]\s", name)
    if m:
        name = m.group(1)
    name = re.sub(r"\d+\.?\d*\s*kv", " ", name, flags=re.I)
    name = re.sub(r"\b(substation|sub\.?|ss\b)\b", " ", name, flags=re.I)
    return re.sub(r"\s+", " ", name).strip()


def in_state(lat: float, lng: float, state: str) -> bool:
    b = STATE_BOUNDS.get(state)
    if not b:
        return True
    (lat_min, lat_max), (lng_min, lng_max) = b
    return lat_min <= lat <= lat_max and lng_min <= lng <= lng_max


def valid_coord(lat, lng) -> bool:
    try:
        lat, lng = float(lat), float(lng)
    except (TypeError, ValueError):
        return False
    return -90 <= lat <= 90 and -180 <= lng <= 180


def round_coord(n: float) -> float:
    return round(n, 6)


def curl_json(url: str) -> list | dict | None:
    try:
        out = subprocess.check_output(
            ["curl", "-sS", "-A", "GridSolve/1.0", url],
            stderr=subprocess.DEVNULL,
            timeout=45,
        )
        return json.loads(out)
    except Exception:
        return None


def load_cache() -> dict:
    if GEO_CACHE.exists():
        return json.loads(GEO_CACHE.read_text())
    return {}


def save_cache(cache: dict) -> None:
    GEO_CACHE.write_text(json.dumps(cache, indent=2))


def load_hifld() -> dict:
    if not HIFLD_CACHE.exists():
        raise SystemExit(f"Missing {HIFLD_CACHE}. Run node scripts/geocode-substations.mjs once to fetch it.")
    return json.loads(HIFLD_CACHE.read_text())


def build_hifld_index(hifld: dict) -> dict[str, list]:
    by_state: dict[str, list] = {}
    for f in hifld.get("features", []):
        p = f.get("properties") or {}
        state = (p.get("STATE") or "").strip().upper()
        coords = (f.get("geometry") or {}).get("coordinates") or []
        if len(coords) < 2:
            continue
        lng, lat = coords[0], coords[1]
        if not valid_coord(lat, lng):
            continue
        rec = {
            "name": p.get("NAME") or "",
            "state": state,
            "county": p.get("COUNTY") or "",
            "lat": lat,
            "lng": lng,
            "norm": norm_text(p.get("NAME") or ""),
            "tokens": tokens(p.get("NAME") or ""),
            "county_norm": norm_county(p.get("COUNTY") or ""),
        }
        by_state.setdefault(state, []).append(rec)
    return by_state


def jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    inter = len(a & b)
    return inter / (len(a | b))


def match_hifld(sub: dict, by_state: dict[str, list]) -> dict | None:
    pool = by_state.get(sub["state"], [])
    sub_norm = norm_text(sub["name"])
    sub_tokens = tokens(sub["name"])
    sub_county = norm_county(sub["county"])
    best, best_score = None, 0.0
    for rec in pool:
        score = 1.0 if sub_norm and rec["norm"] and sub_norm == rec["norm"] else jaccard(sub_tokens, rec["tokens"])
        if sub_county and rec["county_norm"]:
            if sub_county == rec["county_norm"]:
                score += 0.2
            elif sub_county in rec["county_norm"] or rec["county_norm"] in sub_county:
                score += 0.1
            else:
                score -= 0.08
        if sub_norm and rec["norm"] and (sub_norm in rec["norm"] or rec["norm"] in sub_norm):
            score += 0.12
        if score > best_score:
            best_score, best = score, rec
    if not best or best_score < 0.42:
        return None
    return {"lat": best["lat"], "lng": best["lng"], "source": f"hifld:{best['name']}", "precision": "verified"}


def build_queries(sub: dict) -> list[str]:
    base = primary_name(sub["name"])
    county = re.sub(r"\s+Parish$", "", sub.get("county") or "", flags=re.I)
    state = STATE_NAMES.get(sub["state"], sub["state"])
    queries = []

    if re.search(r"plant|fossil|generating|power station|nuclear", sub["name"], re.I):
        queries.append(f"{base}, {county}, {state}, USA")
        queries.append(f"{base} power plant, {state}, USA")

    if county:
        queries.append(f"{base} substation, {county}, {state}, USA")
        queries.append(f"{base}, {county}, {state}, USA")
        queries.append(f"{base} electric substation, {county} County, {state}, USA")

    queries.append(f"{base} substation, {state}, USA")
    queries.append(f"{base}, {state}, USA")

    line = re.match(r"^(.+?)\s[-–—]\s(.+?)(?:\s+\d|$)", sub["name"])
    if line:
        for side in (line.group(1), line.group(2)):
            side = re.sub(r"\d+\.?\d*\s*kv", " ", side, flags=re.I).strip()
            queries.append(f"{side} substation, {state}, USA")

    # dedupe preserving order
    seen = set()
    out = []
    for q in queries:
        q = re.sub(r"\s+", " ", q).strip()
        if q and q not in seen:
            seen.add(q)
            out.append(q)
    return out


def geocode_nominatim(query: str, state: str) -> dict | None:
    params = urllib.parse.urlencode(
        {"q": query, "format": "json", "limit": "1", "countrycodes": "us"}
    )
    data = curl_json(f"https://nominatim.openstreetmap.org/search?{params}")
    if not data:
        return None
    hit = data[0]
    lat, lng = float(hit["lat"]), float(hit["lon"])
    if not valid_coord(lat, lng) or not in_state(lat, lng, state):
        return None
    return {"lat": lat, "lng": lng, "source": f"nominatim:{query}", "precision": "verified"}


def geocode_google(query: str, state: str, api_key: str) -> dict | None:
    params = urllib.parse.urlencode({"address": query, "key": api_key})
    data = curl_json(f"https://maps.googleapis.com/maps/api/geocode/json?{params}")
    if not data or data.get("status") != "OK" or not data.get("results"):
        return None
    loc = data["results"][0]["geometry"]["location"]
    lat, lng = loc["lat"], loc["lng"]
    if not valid_coord(lat, lng) or not in_state(lat, lng, state):
        return None
    return {"lat": lat, "lng": lng, "source": f"google:{query}", "precision": "verified"}


def geocode_photon(query: str, state: str) -> dict | None:
    params = urllib.parse.urlencode({"q": query, "limit": "5"})
    data = curl_json(f"https://photon.komoot.io/api/?{params}")
    if not data:
        return None
    state_name = STATE_NAMES.get(state, state).lower()
    for feat in data.get("features", []):
        props = feat.get("properties") or {}
        admin1 = (props.get("state") or "").lower()
        if admin1 and state_name not in admin1:
            continue
        coords = (feat.get("geometry") or {}).get("coordinates") or []
        if len(coords) < 2:
            continue
        lng, lat = coords[0], coords[1]
        if not valid_coord(lat, lng) or not in_state(lat, lng, state):
            continue
        name = props.get("name") or query
        return {"lat": lat, "lng": lng, "source": f"photon:{name}", "precision": "verified"}
    return None


def geocode_county(sub: dict) -> dict | None:
    county = re.sub(r"\s+Parish$", "", sub.get("county") or "", flags=re.I)
    state = STATE_NAMES.get(sub["state"], sub["state"])
    if not county:
        return None
    for q in (f"{county} County, {state}, USA", f"{county} Parish, {state}, USA", f"{county}, {state}, USA"):
        hit = geocode_nominatim(q, sub["state"])
        time.sleep(NOMINATIM_DELAY)
        if hit:
            hit["precision"] = "county"
            hit["source"] = f"county_centroid:{county},{state}"
            return hit
    return None


def needs_regeocode(sub: dict) -> bool:
    if not valid_coord(sub.get("lat"), sub.get("lng")):
        return True
    return not in_state(float(sub["lat"]), float(sub["lng"]), sub["state"])


def resolve(sub: dict, index: int, by_state: dict, cache: dict, google_key: str | None, stats: dict) -> dict:
    key = str(index)
    if key in cache:
        stats["cached"] += 1
        return cache[key]

    if index in TEASER_INDICES:
        stats["teaser"] += 1
        result = {
            "lat": sub["lat"],
            "lng": sub["lng"],
            "coord_precision": sub.get("coord_precision") or "verified",
            "geocode_source": "teaser_preserved",
        }
        cache[key] = result
        save_cache(cache)
        return result

    hit = match_hifld(sub, by_state)
    if hit and in_state(hit["lat"], hit["lng"], sub["state"]):
        stats["hifld"] += 1
        result = {
            "lat": round_coord(hit["lat"]),
            "lng": round_coord(hit["lng"]),
            "coord_precision": hit["precision"],
            "geocode_source": hit["source"],
        }
        cache[key] = result
        save_cache(cache)
        return result

    queries = build_queries(sub)
    if google_key:
        for q in queries:
            time.sleep(OTHER_DELAY)
            hit = geocode_google(q, sub["state"], google_key)
            if hit:
                stats["google"] += 1
                result = {
                    "lat": round_coord(hit["lat"]),
                    "lng": round_coord(hit["lng"]),
                    "coord_precision": hit["precision"],
                    "geocode_source": hit["source"],
                }
                cache[key] = result
                save_cache(cache)
                return result

    for q in queries:
        time.sleep(NOMINATIM_DELAY)
        stats["nominatim_attempts"] += 1
        hit = geocode_nominatim(q, sub["state"])
        if hit:
            stats["nominatim"] += 1
            result = {
                "lat": round_coord(hit["lat"]),
                "lng": round_coord(hit["lng"]),
                "coord_precision": hit["precision"],
                "geocode_source": hit["source"],
            }
            cache[key] = result
            save_cache(cache)
            return result

    for q in queries[:3]:
        time.sleep(OTHER_DELAY)
        hit = geocode_photon(q, sub["state"])
        if hit:
            stats["photon"] += 1
            result = {
                "lat": round_coord(hit["lat"]),
                "lng": round_coord(hit["lng"]),
                "coord_precision": hit["precision"],
                "geocode_source": hit["source"],
            }
            cache[key] = result
            save_cache(cache)
            return result

    hit = geocode_county(sub)
    if hit:
        stats["county"] += 1
        result = {
            "lat": round_coord(hit["lat"]),
            "lng": round_coord(hit["lng"]),
            "coord_precision": hit["precision"],
            "geocode_source": hit["source"],
        }
        cache[key] = result
        save_cache(cache)
        return result

    stats["failed"] += 1
    result = {"lat": None, "lng": None, "coord_precision": None, "geocode_source": None}
    cache[key] = result
    save_cache(cache)
    return result


def main() -> None:
    google_key = os.environ.get("GOOGLE_MAPS_API_KEY") or os.environ.get("GOOGLE_GEOCODING_API_KEY")
    gridsolve = json.loads(DATA_PATH.read_text())
    hifld = load_hifld()
    by_state = build_hifld_index(hifld)
    cache = load_cache()

    stats = {
        "total": len(gridsolve["substations"]),
        "teaser": 0,
        "cached": 0,
        "hifld": 0,
        "google": 0,
        "nominatim": 0,
        "nominatim_attempts": 0,
        "photon": 0,
        "county": 0,
        "failed": 0,
        "updated": 0,
    }
    report = []

    indices = list(range(len(gridsolve["substations"])))
    if LIMIT:
        indices = indices[:LIMIT]

    for n, i in enumerate(indices, start=1):
        sub = gridsolve["substations"][i]
        resolved = resolve(sub, i, by_state, cache, google_key, stats)

        prev = {"lat": sub.get("lat"), "lng": sub.get("lng")}
        changed = prev["lat"] != resolved["lat"] or prev["lng"] != resolved["lng"]

        if changed:
            report.append(
                {
                    "index": i,
                    "name": sub["name"],
                    "state": sub["state"],
                    "county": sub["county"],
                    "prev": prev,
                    "next": {"lat": resolved["lat"], "lng": resolved["lng"]},
                    "source": resolved.get("geocode_source"),
                    "precision": resolved.get("coord_precision"),
                }
            )
            if not DRY_RUN:
                sub["lat"] = resolved["lat"]
                sub["lng"] = resolved["lng"]
                sub["coord_precision"] = resolved["coord_precision"]
            stats["updated"] += 1

        if n % 25 == 0:
            print(
                f"[{n}/{len(indices)}] updated={stats['updated']} hifld={stats['hifld']} "
                f"google={stats['google']} nom={stats['nominatim']} county={stats['county']} fail={stats['failed']}",
                flush=True,
            )

    REPORT_PATH.write_text(json.dumps({"stats": stats, "report": report[:1000]}, indent=2))

    if not DRY_RUN:
        src = "HIFLD + "
        if google_key:
            src += "Google Maps + "
        src += "OSM geocoding (6 teaser sites preserved)"
        gridsolve["model"]["coord_source"] = src
        DATA_PATH.write_text(json.dumps(gridsolve, indent=2))
        print(f"Wrote {DATA_PATH}")
    else:
        print("Dry run — gridsolve.json not written")

    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
