"""FastAPI application entrypoint for UrbanPilot AI backend routes."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.environment_routes import router as environment_router

app = FastAPI(title="UrbanPilot AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(environment_router)


@app.get("/health")
async def health() -> dict[str, str]:
    """Return service health for load balancers and local checks."""
    return {"status": "ok"}
