"""Environmental Intelligence Agent for route weather and traffic analysis."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Awaitable, Callable

from backend.tools.impact_calculator import calculate_travel_impact
from backend.tools.traffic_tool import fetch_traffic
from backend.tools.weather_tool import fetch_weather

Coordinate = dict[str, float]
WeatherFetcher = Callable[..., Awaitable[dict[str, Any]]]
TrafficFetcher = Callable[..., Awaitable[dict[str, Any]]]


class EnvironmentalIntelligenceAgent:
    """Coordinates weather, traffic, and impact analysis for a trip."""

    def __init__(
        self,
        *,
        weather_fetcher: WeatherFetcher = fetch_weather,
        traffic_fetcher: TrafficFetcher = fetch_traffic,
    ) -> None:
        self._weather_fetcher = weather_fetcher
        self._traffic_fetcher = traffic_fetcher

    async def analyze(
        self,
        *,
        origin: Coordinate,
        destination: Coordinate,
        departure_time: datetime,
    ) -> dict[str, Any]:
        """Return the environmental travel impact report for a route."""
        weather = await self._weather_fetcher(
            origin["lat"],
            origin["lng"],
        )
        traffic = await self._traffic_fetcher(
            origin,
            destination,
            departure_time=departure_time,
        )
        travel_impact = calculate_travel_impact(weather, traffic)

        return {
            "weather": {
                "condition": weather["condition"],
                "temperature": weather["temperature"],
                "humidity": weather["humidity"],
                "windSpeed": weather["windSpeed"],
                "visibility": weather["visibility"],
                "rain": weather["rain"],
                "description": weather["description"],
            },
            "traffic": {
                "level": traffic["level"],
                "delayMinutes": traffic["delayMinutes"],
                "averageSpeed": traffic["averageSpeed"],
                "roadIncidents": traffic.get("roadIncidents", []),
            },
            "travelImpact": travel_impact,
        }


environmental_agent = EnvironmentalIntelligenceAgent()


async def run_environmental_agent(
    origin: Coordinate,
    destination: Coordinate,
    departure_time: datetime,
) -> dict[str, Any]:
    """Public entry point for the Environmental Intelligence Agent."""
    return await environmental_agent.analyze(
        origin=origin,
        destination=destination,
        departure_time=departure_time,
    )
