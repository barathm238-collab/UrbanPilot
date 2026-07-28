# Multi-Modal Transit Fare & Time Arbitrage Swarm

A 4-agent swarm that finds the fastest/cheapest way to get across an
Indian metro city by combining metro schedules, live auto/bike/cab
pricing, and walking, then arbitrages the options against a direct-cab
benchmark — delivered over WhatsApp.

## Status

| Agent | Status |
|---|---|
| 1. Geographic Agent ("The Mapper") | ✅ Built — see below |
| 2. Public Transit Agent ("The Metro Expert") | 🔲 Stub only (`backend/agents/transit_agent.py`) |
| 3. Open Mobility Agent ("The Negotiator") | 🔲 Stub only (`backend/agents/mobility_agent.py`) |
| 4. Synthesis & Arbitrage Agent ("The Brain") | 🔲 Stub only (`backend/agents/synthesis_agent.py`) |
| Environmental Intelligence Agent | ✅ Built (`backend/agents/environmental_agent.py`) |
| WhatsApp UI (Twilio webhook) | ✅ Built — see below |
| Frontend (Vite + React + TypeScript) | ✅ Built |
| FastAPI Backend | ✅ Built (`backend/main.py`) |

## Team split

- **Agent developer**: owns `backend/agents/`, `backend/tools/`, `backend/core/`.
- **UI developer**: owns `backend/webhook/`.
- **Shared contract**: `backend/core/schema.py` — read this first, both of you.

Neither of you needs to touch the other's folder. The only integration
point is one function call: `run_geographic_agent(message)` →
returns a dict shaped like `GeoAgentState`.

## Read these in order

1. `docs/00_project_overview.md` — the whole idea, for explaining the project in review.
2. `docs/01_guidebook_geographic_agent.md` — full walkthrough for the agent developer.
3. `docs/02_guidebook_whatsapp_ui.md` — full walkthrough for the UI developer.

## Quickstart

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in GOOGLE_API_KEY / Twilio creds as needed

# Start all backend services (FastAPI + Flask webhook)
# Windows:
powershell -ExecutionPolicy Bypass -File scripts\start_dev.ps1
# Or individually:
# uvicorn backend.main:app --reload --port 8000
# python webhook/app.py
```

```bash
# Frontend (in a separate terminal)
cd frontend
npm install
npm run dev
```

## File structure

```
UrbanPilot/
├── README.md
├── docs/
│   ├── 00_project_overview.md
│   ├── 01_guidebook_geographic_agent.md
│   └── 02_guidebook_whatsapp_ui.md
├── scripts/
│   └── start_dev.ps1          # starts FastAPI + Flask webhook
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   ├── .env
│   ├── main.py                # FastAPI entrypoint (/api/environment/*)
│   ├── agents/
│   │   ├── environmental_agent.py
│   │   ├── geographic_agent.py
│   │   ├── transit_agent.py
│   │   ├── mobility_agent.py
│   │   └── synthesis_agent.py
│   ├── tools/
│   │   ├── weather_tool.py
│   │   ├── traffic_tool.py
│   │   ├── impact_calculator.py
│   │   ├── geocode_tool.py
│   │   └── transit_hub_tool.py
│   ├── routes/
│   │   └── environment_routes.py
│   ├── webhook/
│   │   ├── app.py             # Flask + Twilio webhook (port 5000)
│   │   └── formatter.py
│   └── tests/
│       └── test_geographic_agent.py
└── frontend/
    ├── vite.config.ts         # proxy /api → 127.0.0.1:8000
    ├── src/
    │   ├── services/
    │   │   ├── apiClient.ts
    │   │   └── environmentService.ts
    │   ├── pages/
    │   │   ├── HomePage.tsx
    │   │   └── RecommendationPage.tsx
    │   └── components/
    │       ├── WeatherCard.tsx
    │       ├── TrafficCard.tsx
    │       └── RecommendationCard.tsx
    └── package.json
```
