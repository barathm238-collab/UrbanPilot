"""Async TomTom Traffic client for Environmental Intelligence Agent."""

from __future__ import annotations

import asyncio
import os
from datetime import datetime
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()


class TrafficToolError(Exception):
    """Base exception for traffic tool failures."""


class MissingTomTomAPIKeyError(TrafficToolError):
    """Raised when TOMTOM_API_KEY is not configured."""


class TrafficAPITimeoutError(TrafficToolError):
    """Raised when TomTom does not respond in time."""


class TrafficRateLimitError(TrafficToolError):
    """Raised when TomTom rate limits the request."""


class TrafficAPIUnavailableError(TrafficToolError):
    """Raised when TomTom is unavailable or returns invalid data."""


Coordinate = dict[str, float]


async def fetch_traffic(
    origin: Coordinate,
    destination: Coordinate,
    *,
    departure_time: datetime | str | None = None,
    api_key: str | None = None,
    client: httpx.AsyncClient | None = None,
    timeout_seconds: float = 8.0,
) -> dict[str, Any]:
    """Fetch route traffic and nearby incident details from TomTom."""
    resolved_api_key = api_key or os.getenv("TOMTOM_API_KEY")
    if not resolved_api_key:
        raise MissingTomTomAPIKeyError("TOMTOM_API_KEY is not configured.")

    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=timeout_seconds)
    try:
        route_payload = await _request_route_with_retry(
            http_client,
            origin,
            destination,
            departure_time,
            resolved_api_key,
        )
        incidents = await _fetch_incidents_safely(
            http_client,
            origin,
            destination,
            resolved_api_key,
        )
    finally:
        if owns_client:
            await http_client.aclose()

    return _parse_traffic(route_payload, incidents)


async def _request_route_with_retry(
    client: httpx.AsyncClient,
    origin: Coordinate,
    destination: Coordinate,
    departure_time: datetime | str | None,
    api_key: str,
) -> dict[str, Any]:
    route_url = (
        "https://api.tomtom.com/routing/1/calculateRoute/"
        f"{origin['lat']},{origin['lng']}:{destination['lat']},{destination['lng']}/json"
    )
    params: dict[str, Any] = {
        "key": api_key,
        "traffic": "true",
        "routeType": "fastest",
        "travelMode": "car",
        "computeTravelTimeFor": "all",
    }
    if departure_time:
        params["departAt"] = (
            departure_time.isoformat()
            if isinstance(departure_time, datetime)
            else departure_time
        )

    last_timeout: httpx.TimeoutException | None = None
    for attempt in range(2):
        try:
            response = await client.get(route_url, params=params)
            return _json_or_raise(response, "TomTom route")
        except httpx.TimeoutException as exc:
            last_timeout = exc
            if attempt == 0:
                await asyncio.sleep(0.2)
                continue
            raise TrafficAPITimeoutError("TomTom Traffic request timed out.") from exc
        except httpx.HTTPError as exc:
            raise TrafficAPIUnavailableError("TomTom Traffic request failed.") from exc

    raise TrafficAPITimeoutError("TomTom Traffic request timed out.") from last_timeout


async def _fetch_incidents_safely(
    client: httpx.AsyncClient,
    origin: Coordinate,
    destination: Coordinate,
    api_key: str,
) -> list[dict[str, Any]]:
    padding = 0.025
    min_lat = min(origin["lat"], destination["lat"]) - padding
    max_lat = max(origin["lat"], destination["lat"]) + padding
    min_lng = min(origin["lng"], destination["lng"]) - padding
    max_lng = max(origin["lng"], destination["lng"]) + padding

    params = {
        "key": api_key,
        "bbox": f"{min_lng},{min_lat},{max_lng},{max_lat}",
        "fields": "{incidents{type,properties{iconCategory,magnitudeOfDelay,events{description,code},from,to}}}",
        "language": "en-US",
        "timeValidityFilter": "present",
    }

    try:
        response = await client.get(
            "https://api.tomtom.com/traffic/services/5/incidentDetails",
            params=params,
        )
        if response.status_code >= 400:
            return []
        data = response.json()
    except (httpx.HTTPError, ValueError):
        return []

    incidents = data.get("incidents", [])
    return incidents if isinstance(incidents, list) else []


def _json_or_raise(response: httpx.Response, service_name: str) -> dict[str, Any]:
    if response.status_code in {401, 403}:
        raise MissingTomTomAPIKeyError(f"{service_name} rejected the API key.")
    if response.status_code == 429:
        raise TrafficRateLimitError(f"{service_name} rate limit exceeded.")
    if response.status_code >= 500:
        raise TrafficAPIUnavailableError(f"{service_name} service is unavailable.")
    if response.status_code >= 400:
        raise TrafficAPIUnavailableError(
            f"{service_name} returned HTTP {response.status_code}."
        )

    try:
        return response.json()
    except ValueError as exc:
        raise TrafficAPIUnavailableError(f"{service_name} returned invalid JSON.") from exc


def _parse_traffic(
    route_payload: dict[str, Any],
    incidents: list[dict[str, Any]],
) -> dict[str, Any]:
    try:
        summary = route_payload["routes"][0]["summary"]
        length_meters = float(summary.get("lengthInMeters", 0))
        travel_seconds = float(summary["travelTimeInSeconds"])
        no_traffic_seconds = float(
            summary.get("noTrafficTravelTimeInSeconds")
            or summary.get("historicTrafficTravelTimeInSeconds")
            or travel_seconds
        )
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise TrafficAPIUnavailableError("TomTom returned invalid route data.") from exc

    delay_minutes = max(0, round((travel_seconds - no_traffic_seconds) / 60))
    average_speed = (
        round((length_meters / 1000) / (travel_seconds / 3600))
        if length_meters > 0 and travel_seconds > 0
        else 0
    )

    return {
        "level": _traffic_level(delay_minutes, average_speed),
        "delayMinutes": delay_minutes,
        "averageSpeed": average_speed,
        "roadIncidents": _normalize_incidents(incidents),
    }


def _traffic_level(delay_minutes: int, average_speed: int) -> str:
    if delay_minutes <= 2 and (average_speed == 0 or average_speed >= 25):
        return "Light"
    if delay_minutes > 15 or (average_speed and average_speed < 25):
        return "Heavy"
    if delay_minutes >= 6 or (average_speed and average_speed < 40):
        return "Moderate"
    return "Light"


def _normalize_incidents(incidents: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for incident in incidents[:5]:
        properties = incident.get("properties") or {}
        events = properties.get("events") or []
        first_event = events[0] if events else {}
        normalized.append(
            {
                "type": incident.get("type"),
                "description": first_event.get("description") or properties.get("from"),
                "severity": properties.get("magnitudeOfDelay"),
            }
        )
    return normalized
