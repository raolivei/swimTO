#!/usr/bin/env python3
"""
Discover all Toronto public swim facilities (indoor + outdoor).

Pulls Toronto Open Data Facilities + Locations, classifies pool tank types,
probes the Toronto Parks JSON API for each location to confirm whether
swim schedules are published, and emits a discovery report.

Outputs:
  - data/discovery/report.json  (full structured report)
  - stdout summary

Usage:
  python jobs/discover_swim_facilities.py --report-only
  python jobs/discover_swim_facilities.py --probe-limit 5
  python jobs/discover_swim_facilities.py --pool-type outdoor
"""
import argparse
import json
import sys
import time as time_mod
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from loguru import logger

from sources.toronto_drop_in_api import TorontoDropInAPI
from sources.toronto_parks_json_api import TorontoParksJSONAPI


POOL_TYPES = {"Indoor Pool", "Outdoor Pool"}


def setup_logging(verbose: bool = False):
    logger.remove()
    logger.add(
        sys.stderr,
        level="DEBUG" if verbose else "INFO",
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <7}</level> | <level>{message}</level>",
    )


def fetch_pool_locations(pool_type_filter: str = "all"):
    """
    Returns dict: location_id -> {
        location_id, name, address, postal_code, district,
        latitude, longitude, has_indoor, has_outdoor, has_wading
    }
    """
    api = TorontoDropInAPI()

    logger.info("Fetching Toronto Open Data Facilities...")
    facilities = api.fetch_facilities()
    logger.info("Fetching Toronto Open Data Locations...")
    locations = api.fetch_locations()

    pools = {}
    for row in facilities:
        ftype = row.get("Facility Type (Display Name)") or ""
        loc_id = row.get("Location ID") or row.get("LocationID")
        if not loc_id:
            continue

        if ftype not in POOL_TYPES and ftype != "Wading Pool":
            continue

        entry = pools.setdefault(
            loc_id,
            {
                "location_id": loc_id,
                "has_indoor": False,
                "has_outdoor": False,
                "has_wading": False,
            },
        )
        if ftype == "Indoor Pool":
            entry["has_indoor"] = True
        elif ftype == "Outdoor Pool":
            entry["has_outdoor"] = True
        elif ftype == "Wading Pool":
            entry["has_wading"] = True

    if pool_type_filter == "outdoor":
        pools = {k: v for k, v in pools.items() if v["has_outdoor"]}
    elif pool_type_filter == "indoor":
        pools = {k: v for k, v in pools.items() if v["has_indoor"]}

    # Skip wading-only sites unless they coexist with indoor/outdoor
    pools = {
        k: v for k, v in pools.items()
        if v["has_indoor"] or v["has_outdoor"]
    }

    # Enrich from locations dataset
    for loc_id, entry in pools.items():
        loc = locations.get(loc_id, {})
        entry["name"] = loc.get("Location Name") or loc.get("LocationName") or ""
        entry["district"] = loc.get("District") or ""
        entry["postal_code"] = loc.get("Postal Code") or loc.get("PostalCode") or ""
        # Build a basic address from street parts
        street_no = loc.get("Street No", "")
        street = " ".join(
            x for x in [
                loc.get("Street No"),
                loc.get("Street Name"),
                loc.get("Street Type"),
                loc.get("Street Direction"),
            ] if x and x != "None"
        )
        entry["address"] = street.strip()

    logger.success(f"Found {len(pools)} pool locations")
    return pools


def fetch_drop_in_swim_locations():
    """Returns set of location_ids that have swim drop-in programs."""
    api = TorontoDropInAPI()
    logger.info("Fetching drop-in programs to identify swim-active locations...")
    programs = api.fetch_drop_in_programs()
    swim_programs = api.filter_swim_activities(programs)
    swim_locs = set()
    for p in swim_programs:
        loc_id = p.get("Location ID") or p.get("LocationID") or p.get("Location_ID")
        if loc_id:
            swim_locs.add(loc_id)
    logger.info(f"Drop-in swim-active locations: {len(swim_locs)}")
    return swim_locs


def probe_json_api(location_id: str, json_api: TorontoParksJSONAPI):
    """Returns (has_programs, weeks_count, error) tuple."""
    try:
        info = json_api._fetch_swim_info(int(location_id))
        if not info:
            return False, 0, None
        weeks = info.get("weeks", []) or []
        has_programs = info.get("hasPrograms", False) or len(weeks) > 0
        return bool(has_programs), len(weeks), None
    except Exception as e:
        return False, 0, str(e)


def build_discovery_report(pool_type_filter: str = "all", probe_limit: int = 0, sleep_s: float = 0.5):
    pools = fetch_pool_locations(pool_type_filter)
    drop_in_swim = fetch_drop_in_swim_locations()

    json_api = TorontoParksJSONAPI()
    items = list(pools.items())
    if probe_limit:
        items = items[:probe_limit]
        logger.warning(f"Probe limit set: probing only first {probe_limit} locations")

    logger.info(f"Probing JSON API for {len(items)} locations (rate-limited)...")
    for i, (loc_id, entry) in enumerate(items):
        has_programs, weeks_count, err = probe_json_api(loc_id, json_api)
        entry["json_api_has_programs"] = has_programs
        entry["json_api_weeks"] = weeks_count
        entry["json_api_error"] = err
        entry["drop_in_swim"] = loc_id in drop_in_swim

        # Classify schedule source
        if has_programs and entry["drop_in_swim"]:
            entry["schedule_source"] = "both"
        elif has_programs:
            entry["schedule_source"] = "json_only"
        elif entry["drop_in_swim"]:
            entry["schedule_source"] = "drop_in_only"
        else:
            entry["schedule_source"] = "no_programs"

        if (i + 1) % 10 == 0:
            logger.info(f"  Probed {i + 1}/{len(items)}")
        time_mod.sleep(sleep_s)

    return pools


def write_report(pools: dict, out_path: Path):
    out_path.parent.mkdir(parents=True, exist_ok=True)

    total = len(pools)
    by_source = {}
    outdoor = 0
    indoor = 0
    both_in_out = 0
    for entry in pools.values():
        by_source[entry.get("schedule_source", "unknown")] = by_source.get(entry.get("schedule_source", "unknown"), 0) + 1
        if entry["has_outdoor"]:
            outdoor += 1
        if entry["has_indoor"]:
            indoor += 1
        if entry["has_outdoor"] and entry["has_indoor"]:
            both_in_out += 1

    report = {
        "summary": {
            "total_locations": total,
            "outdoor_locations": outdoor,
            "indoor_locations": indoor,
            "indoor_and_outdoor": both_in_out,
            "by_schedule_source": by_source,
        },
        "locations": sorted(pools.values(), key=lambda x: (not x["has_outdoor"], x.get("name", ""))),
    }

    with open(out_path, "w") as f:
        json.dump(report, f, indent=2, default=str)
    logger.success(f"Wrote report to {out_path}")
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pool-type", choices=["all", "indoor", "outdoor"], default="all")
    parser.add_argument("--probe-limit", type=int, default=0, help="Cap number of probes (0 = all)")
    parser.add_argument("--sleep", type=float, default=0.5, help="Delay between probes (seconds)")
    parser.add_argument("--out", type=Path, default=Path("data/discovery/report.json"))
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    setup_logging(args.verbose)

    pools = build_discovery_report(
        pool_type_filter=args.pool_type,
        probe_limit=args.probe_limit,
        sleep_s=args.sleep,
    )
    report = write_report(pools, args.out)

    print()
    print("=" * 70)
    print("DISCOVERY SUMMARY")
    print("=" * 70)
    s = report["summary"]
    print(f"Total pool locations:      {s['total_locations']}")
    print(f"  Outdoor pool locations:  {s['outdoor_locations']}")
    print(f"  Indoor pool locations:   {s['indoor_locations']}")
    print(f"  Indoor+outdoor sites:    {s['indoor_and_outdoor']}")
    print(f"By schedule source:        {s['by_schedule_source']}")
    print()
    print(f"Full report: {args.out}")


if __name__ == "__main__":
    main()
