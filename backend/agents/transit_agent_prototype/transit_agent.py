"""
Production Transit Agent

Enriches transit legs (bus / metro) with
fare, duration and delay information.
"""

from backend.core.schema import RouteOptionsState
from backend.tools.transit_tools import (
    get_fare,
    get_duration,
    get_live_status,
)


def run_transit_agent(
    state: RouteOptionsState,
) -> RouteOptionsState:
    try:

        for option in state["options"]:

            for leg in option["legs"]:

                if leg["needs_pricing_from"] != "transit_agent":
                    continue

                leg["fare_rupees"] = get_fare(
                    leg["mode"],
                    leg["distance_km"],
                )

                leg["duration_min"] = get_duration(
                    leg["mode"],
                    leg["distance_km"],
                )

                live = get_live_status(leg["mode"])

                leg["delay_min"] = live["delay_minutes"]

        return state

    except Exception as e:

        state["error"] = str(e)

        return state
