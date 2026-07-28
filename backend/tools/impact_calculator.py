"""Business rules for environmental travel impact decisions."""

from __future__ import annotations

from typing import Any


def calculate_travel_impact(
    weather: dict[str, Any],
    traffic: dict[str, Any],
) -> dict[str, str]:
    """Calculate comfort and transport recommendation from weather and traffic."""
    condition = str(weather.get("condition", "")).lower()
    description = str(weather.get("description", "")).lower()
    traffic_level = str(traffic.get("level", "")).title()
    temperature = float(weather.get("temperature", 0))
    delay_minutes = int(traffic.get("delayMinutes", 0))
    rain = bool(weather.get("rain")) or "rain" in condition
    heavy_rain = rain and (
        str(weather.get("rainIntensity", "")).lower() == "heavy"
        or "heavy rain" in description
    )

    walking_comfort = "Good"
    if rain or temperature > 36:
        walking_comfort = "Poor"
    elif temperature > 32 or traffic_level == "Heavy":
        walking_comfort = "Medium"

    bike_comfort = "Good"
    if heavy_rain or traffic_level == "Heavy" or temperature > 38:
        bike_comfort = "Poor"
    elif rain or traffic_level == "Moderate" or temperature > 34:
        bike_comfort = "Medium"

    recommended_transport = "Bus"
    if delay_minutes > 15:
        recommended_transport = "Metro"
    if traffic_level == "Light" and condition == "clear":
        recommended_transport = "Bike"
    if heavy_rain and traffic_level == "Heavy":
        recommended_transport = "Metro"

    reason = _build_reason(
        rain=rain,
        heavy_rain=heavy_rain,
        condition=weather.get("condition", "weather"),
        traffic_level=traffic_level,
        delay_minutes=delay_minutes,
        temperature=temperature,
        recommended_transport=recommended_transport,
    )

    return {
        "walkingComfort": walking_comfort,
        "bikeComfort": bike_comfort,
        "recommendedTransport": recommended_transport,
        "reason": reason,
    }


def _build_reason(
    *,
    rain: bool,
    heavy_rain: bool,
    condition: Any,
    traffic_level: str,
    delay_minutes: int,
    temperature: float,
    recommended_transport: str,
) -> str:
    if recommended_transport == "Metro" and heavy_rain and traffic_level == "Heavy":
        return "Heavy traffic and heavy rain make metro the most reliable option."
    if recommended_transport == "Metro" and delay_minutes > 15 and rain:
        return "Heavy traffic and rain make metro the most reliable option."
    if recommended_transport == "Metro" and delay_minutes > 15:
        return "Traffic delays are high, so metro is the most reliable option."
    if recommended_transport == "Bike":
        return "Clear weather and light traffic make biking a practical option."
    if rain:
        return f"{condition} reduces outdoor comfort, so bus is the safer fallback."
    if temperature > 36:
        return "High temperature makes walking uncomfortable, so bus is preferred."
    return "Conditions are manageable, so bus offers a balanced travel option."
