"""
tools/transit_tools.py

Helper functions used by the Transit Agent.
Currently backed by deterministic mock logic.
Can later be replaced with GTFS and GTFS-Realtime.
"""

import random

FARE_PER_KM = {
    "bus": 2.5,
    "metro": 3.0,
}

BASE_FARE = {
    "bus": 5,
    "metro": 10,
}

AVG_SPEED_KMPH = {
    "bus": 20,
    "metro": 35,
}


def get_fare(mode: str, distance_km: float | None) -> float:
    distance = distance_km or 0
    return round(
        BASE_FARE.get(mode, 5) + FARE_PER_KM.get(mode, 2.5) * distance,
        2,
    )


def get_duration(mode: str, distance_km: float | None) -> float:
    distance = distance_km or 0
    speed = AVG_SPEED_KMPH.get(mode, 20)
    return round((distance / speed) * 60, 1)


def get_live_status(mode: str) -> dict:
    next_departure = round(random.uniform(2, 15), 1)

    delay = 0.0
    status = "On Time"

    if random.random() < 0.3:
        delay = round(random.uniform(5, 20), 1)
        status = "Delayed"

    return {
        "next_departure_minutes": next_departure,
        "delay_minutes": delay,
        "status": status,
    }
