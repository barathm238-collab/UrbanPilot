"""Async OpenWeather client for Environmental Intelligence Agent."""

from __future__ import annotations

import os
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()


class WeatherToolError(Exception):
    """Base exception for weather tool failures."""


class MissingWeatherAPIKeyError(WeatherToolError):
    """Raised when OPENWEATHER_API_KEY is not configured."""


class WeatherAPITimeoutError(WeatherToolError):
    """Raised when OpenWeather does not respond in time."""


class WeatherRateLimitError(WeatherToolError):
    """Raised when OpenWeather rate limits the request."""


class WeatherAPIUnavailableError(WeatherToolError):
    """Raised when OpenWeather is unavailable or returns invalid data."""


async def fetch_weather(
    lat: float,
    lng: float,
    *,
    api_key: str | None = None,
    client: httpx.AsyncClient | None = None,
    timeout_seconds: float = 8.0,
) -> dict[str, Any]:
    """Fetch current weather details for a coordinate from OpenWeather."""
    resolved_api_key = api_key or os.getenv("OPENWEATHER_API_KEY")
    if not resolved_api_key:
        raise MissingWeatherAPIKeyError("OPENWEATHER_API_KEY is not configured.")

    params = {
        "lat": lat,
        "lon": lng,
        "appid": resolved_api_key,
        "units": "metric",
    }

    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=timeout_seconds)
    try:
        response = await http_client.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params=params,
        )
    except httpx.TimeoutException as exc:
        raise WeatherAPITimeoutError("OpenWeather request timed out.") from exc
    except httpx.HTTPError as exc:
        raise WeatherAPIUnavailableError("OpenWeather request failed.") from exc
    finally:
        if owns_client:
            await http_client.aclose()

    if response.status_code == 401:
        raise MissingWeatherAPIKeyError("OpenWeather rejected the API key.")
    if response.status_code == 429:
        raise WeatherRateLimitError("OpenWeather rate limit exceeded.")
    if response.status_code >= 500:
        raise WeatherAPIUnavailableError("OpenWeather service is unavailable.")
    if response.status_code >= 400:
        raise WeatherAPIUnavailableError(
            f"OpenWeather returned HTTP {response.status_code}."
        )

    try:
        payload = response.json()
        main = payload["main"]
        wind = payload.get("wind", {})
        weather_items = payload.get("weather") or [{}]
    except (KeyError, TypeError, ValueError) as exc:
        raise WeatherAPIUnavailableError("OpenWeather returned invalid data.") from exc

    description = str(weather_items[0].get("description") or "").strip()
    condition = str(weather_items[0].get("main") or description or "Unknown").strip()
    rain_payload = payload.get("rain") or {}
    rain_volume = sum(
        float(value)
        for value in rain_payload.values()
        if isinstance(value, int | float)
    )

    return {
        "condition": condition,
        "temperature": round(float(main["temp"])),
        "humidity": int(main["humidity"]),
        "windSpeed": round(float(wind.get("speed", 0))),
        "visibility": int(payload.get("visibility", 0)),
        "rain": rain_volume > 0 or "rain" in condition.lower(),
        "rainIntensity": "Heavy"
        if rain_volume >= 7.5 or "heavy" in description.lower()
        else "Moderate"
        if rain_volume >= 2.5
        else "Light"
        if rain_volume > 0 or "rain" in condition.lower()
        else "None",
        "description": description or condition,
    }
