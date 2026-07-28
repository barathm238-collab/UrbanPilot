"""FastAPI routes for Environmental Intelligence Agent."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator

from backend.agents.environmental_agent import (
    EnvironmentalIntelligenceAgent,
    environmental_agent,
)
from backend.tools.traffic_tool import (
    MissingTomTomAPIKeyError,
    TrafficAPIUnavailableError,
    TrafficAPITimeoutError,
    TrafficRateLimitError,
)
from backend.tools.weather_tool import (
    MissingWeatherAPIKeyError,
    WeatherAPIUnavailableError,
    WeatherAPITimeoutError,
    WeatherRateLimitError,
)

router = APIRouter(prefix="/api/environment", tags=["environment"])


class CoordinateModel(BaseModel):
    """Latitude and longitude accepted from the frontend."""

    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class EnvironmentAnalyzeRequest(BaseModel):
    """Request body for environmental route analysis."""

    origin: CoordinateModel
    destination: CoordinateModel
    departureTime: datetime

    @field_validator("departureTime")
    @classmethod
    def ensure_departure_time(cls, value: datetime) -> datetime:
        """Reject invalid or missing departure timestamps."""
        return value


class WeatherResponse(BaseModel):
    """Weather response sent to the frontend."""

    condition: str
    temperature: int
    humidity: int
    windSpeed: int
    visibility: int
    rain: bool
    description: str


class TrafficResponse(BaseModel):
    """Traffic response sent to the frontend."""

    level: str
    delayMinutes: int
    averageSpeed: int
    roadIncidents: list[dict[str, Any]]


class TravelImpactResponse(BaseModel):
    """Business recommendation response sent to the frontend."""

    walkingComfort: str
    bikeComfort: str
    recommendedTransport: str
    reason: str


class EnvironmentAnalyzeResponse(BaseModel):
    """Complete environmental analysis response."""

    model_config = ConfigDict(extra="forbid")

    weather: WeatherResponse
    traffic: TrafficResponse
    travelImpact: TravelImpactResponse


def get_environmental_agent() -> EnvironmentalIntelligenceAgent:
    """Dependency injection hook for tests and future orchestrator wiring."""
    return environmental_agent


@router.post(
    "/analyze",
    response_model=EnvironmentAnalyzeResponse,
    status_code=status.HTTP_200_OK,
)
async def analyze_environment(
    payload: EnvironmentAnalyzeRequest,
    agent: Annotated[
        EnvironmentalIntelligenceAgent,
        Depends(get_environmental_agent),
    ],
) -> dict[str, Any]:
    """Analyze route weather, traffic, and travel impact."""
    try:
        return await agent.analyze(
            origin=payload.origin.model_dump(),
            destination=payload.destination.model_dump(),
            departure_time=payload.departureTime,
        )
    except (MissingWeatherAPIKeyError, MissingTomTomAPIKeyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except (WeatherAPITimeoutError, TrafficAPITimeoutError) as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=str(exc),
        ) from exc
    except (WeatherRateLimitError, TrafficRateLimitError) as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(exc),
        ) from exc
    except (WeatherAPIUnavailableError, TrafficAPIUnavailableError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
