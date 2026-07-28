"""
agents/route_options_agent.py

Agent 2: The Route Options Agent

Job: take Agent 1's output (origin/destination coordinates + nearest
metro stations) and generate the actual candidate multi-modal routes —
the different cards the user sees on the Compare screen (Metro, Cab,
Rapido + Metro, Bus, Walking).

This agent does NOT know any fares, ETAs, or delays yet — that's Agents
3 and 4's job. It only decides WHICH combinations of modes are worth
presenting, and builds each one as an ordered list of legs with whatever
is knowable right now (distances, from Agent 1's coordinates) and a flag
on each leg saying which downstream agent needs to price it.

See docs/03_guidebook_route_options_agent.md for the full walkthrough.
"""

from backend.core.schema import (
    GeoAgentState,
    RouteLeg,
    RouteOption,
    RouteOptionsState,
)
from backend.tools.transit_hub_tool import haversine_km, find_nearest_bus_stops

WALK_SPEED_KMPH = 4.5
MAX_WALKABLE_KM = (
    6.0  # beyond this we still generate it, but frontend can de-emphasize it
)
MAX_FIRST_LAST_MILE_WALK_KM = (
    1.2  # beyond this, prefer auto/bike for the station approach leg
)


def _walk_leg(from_name, from_lat, from_lon, to_name, to_lat, to_lon) -> RouteLeg:
    dist = haversine_km(from_lat, from_lon, to_lat, to_lon)
    return RouteLeg(
        mode="walk",
        from_name=from_name,
        to_name=to_name,
        from_lat=from_lat,
        from_lon=from_lon,
        to_lat=to_lat,
        to_lon=to_lon,
        distance_km=round(dist, 2),
        duration_min=round((dist / WALK_SPEED_KMPH) * 60, 1),
        fare_rupees=0,
        line_or_service=None,
        delay_min=0,
        needs_pricing_from=None,  # walking is fully known already, no downstream agent needed
    )


def _unpriced_leg(
    mode, from_name, from_lat, from_lon, to_name, to_lat, to_lon, owner
) -> RouteLeg:
    dist = haversine_km(from_lat, from_lon, to_lat, to_lon)
    return RouteLeg(
        mode=mode,
        from_name=from_name,
        to_name=to_name,
        from_lat=from_lat,
        from_lon=from_lon,
        to_lat=to_lat,
        to_lon=to_lon,
        distance_km=round(
            dist, 2
        ),  # straight-line for now; Agent 4 refines cab/auto legs via OSRM
        duration_min=None,
        fare_rupees=None,
        line_or_service=None,
        delay_min=None,
        needs_pricing_from=owner,
    )


def generate_route_options(geo: GeoAgentState) -> RouteOptionsState:
    """
    The single public entry point for this agent — this is what Agent 6's
    orchestrator graph calls as its first step.
    """
    if geo.get("error") or not geo.get("origin") or not geo.get("destination"):
        return RouteOptionsState(
            geo=geo,
            weather_traffic=None,
            options=[],
            error=geo.get("error") or "Missing origin/destination",
        )

    origin, destination = geo["origin"], geo["destination"]
    o_lat, o_lon = origin["lat"], origin["lon"]
    d_lat, d_lon = destination["lat"], destination["lon"]
    total_km = haversine_km(o_lat, o_lon, d_lat, d_lon)

    options: list[RouteOption] = []

    # --- Option: Walking (always generate; frontend decides whether it's worth showing) ---
    walk_leg = _walk_leg(
        origin["display_name"], o_lat, o_lon, destination["display_name"], d_lat, d_lon
    )
    options.append(
        RouteOption(
            id="walking",
            label="Walking",
            legs=[walk_leg],
            total_cost_rupees=None,
            total_duration_min=None,
            safety_score=None,
            recommended=False,
        )
    )

    # --- Option: Direct Cab (single mobility leg, no transit at all) ---
    cab_leg = _unpriced_leg(
        "cab",
        origin["display_name"],
        o_lat,
        o_lon,
        destination["display_name"],
        d_lat,
        d_lon,
        "mobility_agent",
    )
    options.append(
        RouteOption(
            id="cab",
            label="Cab",
            legs=[cab_leg],
            total_cost_rupees=None,
            total_duration_min=None,
            safety_score=None,
            recommended=False,
        )
    )

    # --- Option: Metro (walk -> metro -> walk) — needs a station near BOTH ends ---
    o_stations = origin.get("nearest_stations") or []
    d_stations = destination.get("nearest_stations") or []
    if o_stations and d_stations:
        o_station, d_station = o_stations[0], d_stations[0]
        legs = [
            _walk_leg(
                origin["display_name"],
                o_lat,
                o_lon,
                o_station["name"],
                o_station["lat"],
                o_station["lon"],
            ),
            _unpriced_leg(
                "metro",
                o_station["name"],
                o_station["lat"],
                o_station["lon"],
                d_station["name"],
                d_station["lat"],
                d_station["lon"],
                "transit_agent",
            ),
            _walk_leg(
                d_station["name"],
                d_station["lat"],
                d_station["lon"],
                destination["display_name"],
                d_lat,
                d_lon,
            ),
        ]
        options.append(
            RouteOption(
                id="metro",
                label="Metro",
                legs=legs,
                total_cost_rupees=None,
                total_duration_min=None,
                safety_score=None,
                recommended=False,
            )
        )

        # --- Option: Rapido + Metro — swap the first walk leg for an auto/bike leg
        # if the walk to the origin station is long enough that a first-mile ride
        # actually saves meaningful time. This is a real decision, not decoration:
        # a 200m walk doesn't need a bike-taxi; an 1800m one does. ---
        if (
            legs[0]["distance_km"]
            and legs[0]["distance_km"] > MAX_FIRST_LAST_MILE_WALK_KM
        ):
            first_mile = _unpriced_leg(
                "auto",
                origin["display_name"],
                o_lat,
                o_lon,
                o_station["name"],
                o_station["lat"],
                o_station["lon"],
                "mobility_agent",
            )
            rapido_legs = [first_mile, legs[1], legs[2]]
            options.append(
                RouteOption(
                    id="rapido_metro",
                    label="Rapido + Metro",
                    legs=rapido_legs,
                    total_cost_rupees=None,
                    total_duration_min=None,
                    safety_score=None,
                    recommended=False,
                )
            )

    # --- Option: Bus (walk -> bus -> walk) — needs a bus stop near both ends ---
    o_stops = find_nearest_bus_stops(o_lat, o_lon)
    d_stops = find_nearest_bus_stops(d_lat, d_lon)
    if o_stops and d_stops:
        o_stop, d_stop = o_stops[0], d_stops[0]
        bus_legs = [
            _walk_leg(
                origin["display_name"],
                o_lat,
                o_lon,
                o_stop["name"],
                o_stop["lat"],
                o_stop["lon"],
            ),
            _unpriced_leg(
                "bus",
                o_stop["name"],
                o_stop["lat"],
                o_stop["lon"],
                d_stop["name"],
                d_stop["lat"],
                d_stop["lon"],
                "transit_agent",
            ),
            _walk_leg(
                d_stop["name"],
                d_stop["lat"],
                d_stop["lon"],
                destination["display_name"],
                d_lat,
                d_lon,
            ),
        ]
        options.append(
            RouteOption(
                id="bus",
                label="Bus",
                legs=bus_legs,
                total_cost_rupees=None,
                total_duration_min=None,
                safety_score=None,
                recommended=False,
            )
        )

    return RouteOptionsState(geo=geo, weather_traffic=None, options=options, error=None)


if __name__ == "__main__":
    import json
    from backend.agents.geographic_agent import run_geographic_agent

    geo = run_geographic_agent("I want to travel from Koyambedu to Vadapalani")

    routes = generate_route_options(geo)

    print(json.dumps(routes, indent=2))
