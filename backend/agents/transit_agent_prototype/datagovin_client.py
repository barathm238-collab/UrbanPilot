"""
agents/transit_agent_prototype/datagovin_client.py

Real integration with data.gov.in's Open Government Data API for:
- Chennai Metro Rail Limited dataset (resource_id below)
- SETC bus routes/types/services/timings dataset (resource_id TBD - see note)

WHY THIS FILE IS SPLIT FROM transit_agent.py:
I don't yet know this dataset's actual field names (column names differ
per dataset, and data.gov.in's own site blocks automated fetching so I
couldn't inspect it directly). Rather than guess field names and risk
writing code that looks right but silently returns wrong/empty data,
this file:
  1. Makes the REAL API call (this part is correct and complete)
  2. Prints the RAW response so you can see actual field names
  3. Leaves ONE clearly marked function (`map_record_to_leg_result`) for
     you to finish once you've seen a real record - should take 5 minutes
     once you can see the actual JSON.

SECURITY NOTE: you've now pasted your data.gov.in API key in plain chat
text a couple of times. It's not a high-value secret (data.gov.in keys
are free/self-service, rate-limited, not billing-linked), but good
practice regardless: this file reads it from .env, never hardcode it
directly in code you might commit.
"""

import os
import json
import socket
import requests
import requests.packages.urllib3.util.connection as urllib3_cn
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Windows-specific fix: Python's `requests` library sometimes tries IPv6
# first against data.gov.in's servers and stalls until timeout, even
# though curl/browser (which fall back to IPv4 faster) work fine. This
# forces IPv4, which resolves the "curl/browser works, Python hangs" issue.
# ---------------------------------------------------------------------------

def _allowed_gai_family():
    return socket.AF_INET

urllib3_cn.allowed_gai_family = _allowed_gai_family

DATA_GOV_IN_API_KEY = os.getenv("DATA_GOV_IN_API_KEY")

# Resource IDs - one per dataset.
# CORRECTED: 1f10d3eb-a425-4246-8800-3f72bf7ad2b0 is actually the SETC
# bus dataset (confirmed from its real response: "title": "SETC Bus
# Routes, Types, Services and Timings") - NOT Chennai Metro as first
# assumed. Get the real Chennai Metro resource_id from its own dataset
# page's "API" tab (the chennai-metro-rail-limited-chennai-20-06-2019
# page), same way you got this one.
RESOURCE_IDS = {
    "setc_bus": "1f10d3eb-a425-4246-8800-3f72bf7ad2b0",
    "chennai_metro": None,  # TODO: paste the CORRECT metro resource_id here
}

BASE_URL = "https://api.data.gov.in/resource/{resource_id}"

# Local cache file, sitting next to this script - a one-time real snapshot
# of the full SETC dataset (all 549 records), fetched via PowerShell when
# the live API was reachable. Used as a fallback so your demo doesn't
# depend on data.gov.in's API being up/fast at the exact moment you present.
CACHE_DIR = os.path.dirname(os.path.abspath(__file__))
SETC_CACHE_PATH = os.path.join(CACHE_DIR, "setc_bus_full_cache.json")


def fetch_raw_records(dataset: str, limit: int = 10, offset: int = 0, filters: dict = None) -> dict:
    """
    Real call to the data.gov.in API. Returns the full raw JSON response
    (not yet mapped to our schema) so you can inspect actual field names.

    `filters` lets you filter server-side, e.g. {"station_name": "Koyambedu"}
    - exact filter field names depend on the dataset's real columns,
    which you'll see once you look at a raw response.
    """
    resource_id = RESOURCE_IDS.get(dataset)
    if not resource_id:
        raise ValueError(f"No resource_id set for dataset '{dataset}' - add it to RESOURCE_IDS.")
    if not DATA_GOV_IN_API_KEY:
        raise ValueError("DATA_GOV_IN_API_KEY not found - add it to your .env file.")

    url = BASE_URL.format(resource_id=resource_id)
    params = {
        "api-key": DATA_GOV_IN_API_KEY,
        "format": "json",
        "limit": limit,
        "offset": offset,
    }
    if filters:
        for field, value in filters.items():
            params[f"filters[{field}]"] = value

    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def get_all_setc_records(prefer_live: bool = True) -> list:
    """
    Returns the FULL list of SETC records (all ~549), trying the live
    API first (single request, since the whole dataset fits in one page),
    and falling back to the local cache file if the live call fails for
    any reason (timeout, network issue, API downtime). This is what
    demo-day reliability actually depends on - never let a live network
    hiccup break the presentation.
    """
    if prefer_live:
        try:
            raw = fetch_raw_records("setc_bus", limit=600, offset=0)
            records = raw.get("records", [])
            if records:
                return records
        except Exception as e:
            print(f"[live fetch failed, falling back to cache: {e}]")

    if os.path.exists(SETC_CACHE_PATH):
        with open(SETC_CACHE_PATH, "r", encoding="utf-8-sig") as f:
            raw = json.load(f)
        return raw.get("records", [])

    raise RuntimeError(
        f"Live fetch failed AND no cache file found at {SETC_CACHE_PATH}. "
        "Run the PowerShell command to generate the cache first."
    )


# ---------------------------------------------------------------------------
# REAL field mapping - based on actual SETC dataset response:
# sl__no_, depot, route_no_, from, to, route_length, type, no_of_service,
# departure_timings
#
# IMPORTANT: this dataset has NO fare field. SETC doesn't publish fares
# in this dataset - only route, distance, service type, and departure
# times. If you need SETC fares, that needs a separate fare model (like
# the MTC stage-fare one), not something this API provides.
#
# departure_timings format is messy real-world government data: comma-
# separated times like "17.45", "21.3", "19.15" - inconsistently using
# 1 or 2 digits after the decimal to mean minutes. parse_departure_time()
# below handles both cases.
# ---------------------------------------------------------------------------

def parse_departure_time(time_str: str) -> str:
    """
    Converts a single messy time value like '21.3' or '19.15' into
    'HH:MM'. Handles the dataset's inconsistent 1-digit vs 2-digit
    minute notation: '21.3' -> 21:30, '19.15' -> 19:15.
    """
    time_str = time_str.strip()
    if "." not in time_str:
        return f"{int(time_str):02d}:00"
    hour_str, min_str = time_str.split(".", 1)
    hour = int(hour_str)
    min_str = min_str.strip()
    minute = int(min_str) * 10 if len(min_str) == 1 else int(min_str)
    return f"{hour:02d}:{minute:02d}"


def parse_departure_timings(raw: str) -> list:
    """Splits and parses the comma-separated departure_timings field."""
    if not raw:
        return []
    parts = [p.strip() for p in raw.split(",") if p.strip()]
    parsed = []
    for p in parts:
        try:
            parsed.append(parse_departure_time(p))
        except ValueError:
            continue  # skip malformed entries rather than crash
    return parsed


def map_record_to_leg_result(record: dict) -> dict:
    """Maps one real SETC record into a usable leg shape. No fare field
    is available from this dataset - fare_inr is intentionally None."""
    return {
        "line_number": record.get("route_no_"),
        "depot": record.get("depot"),
        "origin_station": record.get("from"),
        "destination_station": record.get("to"),
        "distance_km": float(record.get("route_length", 0) or 0),
        "service_type": record.get("type"),
        "num_services_per_day": int(record.get("no_of_service", 0) or 0),
        "departure_times": parse_departure_timings(record.get("departure_timings", "")),
        "fare_inr": None,  # not provided by this dataset
    }


def find_routes(origin_city: str, destination_city: str) -> list:
    """
    Searches the FULL dataset (all ~549 records, via get_all_setc_records
    which handles live-vs-cache fallback) for routes matching origin/
    destination city names (case-insensitive, partial match). This
    dataset only covers intercity routes, so this is only useful if
    origin_city/destination_city are actual cities (e.g. 'Chennai',
    'Coimbatore'), not local Chennai neighborhoods.
    """
    origin_city = origin_city.strip().upper()
    destination_city = destination_city.strip().upper()

    all_records = get_all_setc_records()
    matches = []
    for r in all_records:
        if origin_city in r.get("from", "").upper() and destination_city in r.get("to", "").upper():
            matches.append(map_record_to_leg_result(r))
    return matches


if __name__ == "__main__":
    print("=== Loading SETC records (live, falling back to cache if needed) ===")
    all_records = get_all_setc_records()
    print(f"Loaded {len(all_records)} total records\n")

    print("=== Mapped records (first 5) ===")
    for r in all_records[:5]:
        print(json.dumps(map_record_to_leg_result(r), indent=2))

    print("\n=== Searching for Bangalore -> Chennai routes ===")
    results = find_routes("Bangalore", "Chennai")
    print(f"Found {len(results)} matching route(s):")
    for r in results:
        print(json.dumps(r, indent=2))