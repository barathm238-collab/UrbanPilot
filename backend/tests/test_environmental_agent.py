"""Unit tests for the Environmental Intelligence Agent stack.

All OpenWeather and TomTom calls are mocked with httpx.MockTransport or injected
agent dependencies. These tests must never call real external APIs.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

import httpx
import pytest
from fastapi import FastAPI

from backend.agents.environmental_agent import EnvironmentalIntelligenceAgent
from backend.routes.environment_routes import (
    get_environmental_agent,
    router as environment_router,
)
from backend.tools.impact_calculator import calculate_travel_impact
from backend.tools.traffic_tool import (
    MissingTomTomAPIKeyError,
    TrafficAPIUnavailableError,
    TrafficAPITimeoutError,
    TrafficRateLimitError,
    fetch_traffic,
)
from backend.tools.weather_tool import (
    MissingWeatherAPIKeyError,
    WeatherAPIUnavailableError,
    WeatherAPITimeoutError,
    WeatherRateLimitError,
    fetch_weather,
)


pytestmark = pytest.mark.asyncio

ORIGIN = {"lat": 11.0168, "lng": 76.9558}
DESTINATION = {"lat": 10.998, "lng": 76.97}
DEPARTURE_TIME = datetime.fromisoformat("2026-07-30T09:00:00")
REQUEST_BODY = {
    "origin": ORIGIN,
    "destination": DESTINATION,
    "departureTime": "2026-07-30T09:00:00",
}


def openweather_response(
    *,
    status_code: int = 200,
    json: dict[str, Any] | None = None,
) -> httpx.Response:
    return httpx.Response(
        status_code,
        json=json
        if json is not None
        else {
            "main": {"temp": 28.2, "humidity": 91},
            "wind": {"speed": 10.7},
            "visibility": 3500,
            "rain": {"1h": 3.2},
            "weather": [{"main": "Rain", "description": "moderate rain"}],
        },
    )


def tomtom_route_response(
    *,
    status_code: int = 200,
    length_meters: int = 6000,
    travel_seconds: int = 600,
    no_traffic_seconds: int = 600,
) -> httpx.Response:
    return httpx.Response(
        status_code,
        json={
            "routes": [
                {
                    "summary": {
                        "lengthInMeters": length_meters,
                        "travelTimeInSeconds": travel_seconds,
                        "noTrafficTravelTimeInSeconds": no_traffic_seconds,
                    }
                }
            ]
        },
    )


def tomtom_incidents_response() -> httpx.Response:
    return httpx.Response(
        200,
        json={
            "incidents": [
                {
                    "type": "Feature",
                    "properties": {
                        "magnitudeOfDelay": 2,
                        "events": [{"description": "Congestion"}],
                    },
                }
            ]
        },
    )


def make_route_app(agent: Any) -> FastAPI:
    app = FastAPI()
    app.include_router(environment_router)
    app.dependency_overrides[get_environmental_agent] = lambda: agent
    return app


async def post_environment(app: FastAPI, body: dict[str, Any] = REQUEST_BODY) -> httpx.Response:
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        return await client.post("/api/environment/analyze", json=body)


async def test_weather_tool_parses_successful_openweather_response() -> None:
    transport = httpx.MockTransport(lambda request: openweather_response())

    async with httpx.AsyncClient(transport=transport) as client:
        weather = await fetch_weather(
            ORIGIN["lat"],
            ORIGIN["lng"],
            api_key="openweather-test-key",
            client=client,
        )

    assert weather == {
        "condition": "Rain",
        "temperature": 28,
        "humidity": 91,
        "windSpeed": 11,
        "visibility": 3500,
        "rain": True,
        "rainIntensity": "Moderate",
        "description": "moderate rain",
    }


async def test_weather_tool_missing_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("OPENWEATHER_API_KEY", raising=False)

    with pytest.raises(MissingWeatherAPIKeyError):
        await fetch_weather(ORIGIN["lat"], ORIGIN["lng"])


async def test_weather_tool_openweather_timeout() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.TimeoutException("OpenWeather timeout", request=request)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        with pytest.raises(WeatherAPITimeoutError):
            await fetch_weather(
                ORIGIN["lat"],
                ORIGIN["lng"],
                api_key="openweather-test-key",
                client=client,
            )


@pytest.mark.parametrize(
    ("status_code", "expected_error"),
    [
        (429, WeatherRateLimitError),
        (500, WeatherAPIUnavailableError),
    ],
)
async def test_weather_tool_openweather_error_responses(
    status_code: int,
    expected_error: type[Exception],
) -> None:
    transport = httpx.MockTransport(
        lambda request: openweather_response(status_code=status_code)
    )

    async with httpx.AsyncClient(transport=transport) as client:
        with pytest.raises(expected_error):
            await fetch_weather(
                ORIGIN["lat"],
                ORIGIN["lng"],
                api_key="openweather-test-key",
                client=client,
            )


async def test_traffic_tool_parses_successful_tomtom_response() -> None:
    requested_urls: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requested_urls.append(str(request.url))
        if "calculateRoute" in str(request.url):
            return tomtom_route_response(
                length_meters=7000,
                travel_seconds=1200,
                no_traffic_seconds=540,
            )
        return tomtom_incidents_response()

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        traffic = await fetch_traffic(
            ORIGIN,
            DESTINATION,
            departure_time=DEPARTURE_TIME,
            api_key="tomtom-test-key",
            client=client,
        )

    assert any("calculateRoute" in url for url in requested_urls)
    assert any("incidentDetails" in url for url in requested_urls)
    assert traffic == {
        "level": "Heavy",
        "delayMinutes": 11,
        "averageSpeed": 21,
        "roadIncidents": [
            {
                "type": "Feature",
                "description": "Congestion",
                "severity": 2,
            }
        ],
    }


async def test_traffic_tool_no_traffic_response_is_light() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if "calculateRoute" in str(request.url):
            return tomtom_route_response()
        return httpx.Response(200, json={"incidents": []})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        traffic = await fetch_traffic(
            ORIGIN,
            DESTINATION,
            departure_time=DEPARTURE_TIME,
            api_key="tomtom-test-key",
            client=client,
        )

    assert traffic["level"] == "Light"
    assert traffic["delayMinutes"] == 0
    assert traffic["averageSpeed"] == 36
    assert traffic["roadIncidents"] == []


async def test_traffic_tool_missing_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("TOMTOM_API_KEY", raising=False)

    with pytest.raises(MissingTomTomAPIKeyError):
        await fetch_traffic(ORIGIN, DESTINATION, departure_time=DEPARTURE_TIME)


async def test_traffic_tool_retries_once_then_succeeds_after_timeout() -> None:
    calls = {"route": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        if "calculateRoute" in str(request.url):
            calls["route"] += 1
            if calls["route"] == 1:
                raise httpx.TimeoutException("TomTom timeout", request=request)
            return tomtom_route_response(
                length_meters=7000,
                travel_seconds=1200,
                no_traffic_seconds=540,
            )
        return httpx.Response(200, json={"incidents": []})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        traffic = await fetch_traffic(
            ORIGIN,
            DESTINATION,
            departure_time=DEPARTURE_TIME,
            api_key="tomtom-test-key",
            client=client,
        )

    assert calls["route"] == 2
    assert traffic["level"] == "Heavy"


async def test_traffic_tool_tomtom_timeout_after_retry() -> None:
    calls = {"route": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["route"] += 1
        raise httpx.TimeoutException("TomTom timeout", request=request)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        with pytest.raises(TrafficAPITimeoutError):
            await fetch_traffic(
                ORIGIN,
                DESTINATION,
                departure_time=DEPARTURE_TIME,
                api_key="tomtom-test-key",
                client=client,
            )

    assert calls["route"] == 2


@pytest.mark.parametrize(
    ("status_code", "expected_error"),
    [
        (429, TrafficRateLimitError),
        (500, TrafficAPIUnavailableError),
    ],
)
async def test_traffic_tool_tomtom_error_responses(
    status_code: int,
    expected_error: type[Exception],
) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if "calculateRoute" in str(request.url):
            return tomtom_route_response(status_code=status_code)
        return httpx.Response(200, json={"incidents": []})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        with pytest.raises(expected_error):
            await fetch_traffic(
                ORIGIN,
                DESTINATION,
                departure_time=DEPARTURE_TIME,
                api_key="tomtom-test-key",
                client=client,
            )


async def test_environmental_agent_combines_mocked_dependencies() -> None:
    calls: dict[str, Any] = {}

    async def weather_fetcher(lat: float, lng: float) -> dict[str, Any]:
        calls["weather"] = {"lat": lat, "lng": lng}
        return {
            "condition": "Rain",
            "temperature": 28,
            "humidity": 91,
            "windSpeed": 11,
            "visibility": 4000,
            "rain": True,
            "rainIntensity": "Moderate",
            "description": "moderate rain",
        }

    async def traffic_fetcher(
        origin: dict[str, float],
        destination: dict[str, float],
        *,
        departure_time: datetime,
    ) -> dict[str, Any]:
        calls["traffic"] = {
            "origin": origin,
            "destination": destination,
            "departure_time": departure_time,
        }
        return {
            "level": "Heavy",
            "delayMinutes": 18,
            "averageSpeed": 21,
            "roadIncidents": [],
        }

    agent = EnvironmentalIntelligenceAgent(
        weather_fetcher=weather_fetcher,
        traffic_fetcher=traffic_fetcher,
    )

    result = await agent.analyze(
        origin=ORIGIN,
        destination=DESTINATION,
        departure_time=DEPARTURE_TIME,
    )

    assert calls["weather"] == {"lat": ORIGIN["lat"], "lng": ORIGIN["lng"]}
    assert calls["traffic"] == {
        "origin": ORIGIN,
        "destination": DESTINATION,
        "departure_time": DEPARTURE_TIME,
    }
    assert result["weather"]["condition"] == "Rain"
    assert result["traffic"]["level"] == "Heavy"
    assert result["travelImpact"] == {
        "walkingComfort": "Poor",
        "bikeComfort": "Poor",
        "recommendedTransport": "Metro",
        "reason": "Heavy traffic and rain make metro the most reliable option.",
    }


async def test_impact_calculator_sunny_light_traffic_recommends_bike() -> None:
    impact = calculate_travel_impact(
        {
            "condition": "Clear",
            "temperature": 29,
            "rain": False,
            "description": "clear sky",
        },
        {"level": "Light", "delayMinutes": 0, "averageSpeed": 48},
    )

    assert impact["walkingComfort"] == "Good"
    assert impact["bikeComfort"] == "Good"
    assert impact["recommendedTransport"] == "Bike"


async def test_environment_endpoint_successful_response() -> None:
    class SuccessfulAgent:
        async def analyze(self, **kwargs: Any) -> dict[str, Any]:
            assert kwargs == {
                "origin": ORIGIN,
                "destination": DESTINATION,
                "departure_time": DEPARTURE_TIME,
            }
            return {
                "weather": {
                    "condition": "Rain",
                    "temperature": 28,
                    "humidity": 91,
                    "windSpeed": 11,
                    "visibility": 3500,
                    "rain": True,
                    "description": "moderate rain",
                },
                "traffic": {
                    "level": "Heavy",
                    "delayMinutes": 18,
                    "averageSpeed": 21,
                    "roadIncidents": [],
                },
                "travelImpact": {
                    "walkingComfort": "Poor",
                    "bikeComfort": "Poor",
                    "recommendedTransport": "Metro",
                    "reason": "Heavy traffic and rain make metro the most reliable option.",
                },
            }

    response = await post_environment(make_route_app(SuccessfulAgent()))

    assert response.status_code == 200
    assert response.json()["travelImpact"]["recommendedTransport"] == "Metro"


@pytest.mark.parametrize(
    "body",
    [
        {
            **REQUEST_BODY,
            "origin": {"lat": 91, "lng": 76.9558},
        },
        {
            **REQUEST_BODY,
            "destination": {"lat": 10.998, "lng": 181},
        },
    ],
)
async def test_environment_endpoint_invalid_coordinates(body: dict[str, Any]) -> None:
    class UnusedAgent:
        async def analyze(self, **kwargs: Any) -> dict[str, Any]:
            raise AssertionError("Agent should not be called for invalid coordinates.")

    response = await post_environment(make_route_app(UnusedAgent()), body)

    assert response.status_code == 422


@pytest.mark.parametrize(
    ("exception", "expected_status"),
    [
        (MissingWeatherAPIKeyError("OPENWEATHER_API_KEY is not configured."), 503),
        (MissingTomTomAPIKeyError("TOMTOM_API_KEY is not configured."), 503),
        (WeatherAPITimeoutError("OpenWeather request timed out."), 504),
        (TrafficAPITimeoutError("TomTom Traffic request timed out."), 504),
        (WeatherRateLimitError("OpenWeather rate limit exceeded."), 429),
        (TrafficRateLimitError("TomTom route rate limit exceeded."), 429),
        (WeatherAPIUnavailableError("OpenWeather service is unavailable."), 502),
        (TrafficAPIUnavailableError("TomTom route service is unavailable."), 502),
    ],
)
async def test_environment_endpoint_error_mapping(
    exception: Exception,
    expected_status: int,
) -> None:
    class FailingAgent:
        async def analyze(self, **kwargs: Any) -> dict[str, Any]:
            raise exception

    response = await post_environment(make_route_app(FailingAgent()))

    assert response.status_code == expected_status
    assert response.json()["detail"] == str(exception)
