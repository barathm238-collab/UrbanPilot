"""
agents/geographic_agent.py

Agent 1: The Geographic Agent ("The Mapper")

Job: given a raw WhatsApp message like "from Anna Nagar to T Nagar",
figure out the origin and destination, geocode both, and attach the
nearest metro/transit hub to each.

This is built as a LangGraph StateGraph with three nodes, on purpose —
even though one Python function could technically do all of this, the
graph structure is what lets Agents 2, 3, and 4 slot in later without
anyone rewriting this file. See the guidebook (docs/01_guidebook_geographic_agent.md)
for the full walkthrough of *why* each piece exists.
"""

from dotenv import load_dotenv

load_dotenv()

import os
import re

from langgraph.graph import StateGraph, END

from backend.core.schema import GeoAgentState
from backend.tools.geocode_tool import geocode_address
from backend.tools.transit_hub_tool import find_nearest_transit_hubs

# ---------------------------------------------------------------------------
# Optional LLM-based parsing. If no GOOGLE_API_KEY is set, we fall back to a
# regex so the agent still works (important for demo-day reliability).
# ---------------------------------------------------------------------------
USE_LLM = bool(os.getenv("GOOGLE_API_KEY"))

if USE_LLM:
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.prompts import ChatPromptTemplate
    from pydantic import BaseModel, Field

    class LocationPair(BaseModel):
        origin: str = Field(description="The starting location mentioned by the user")
        destination: str = Field(
            description="The destination location mentioned by the user"
        )

    _llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite", temperature=0)
    _structured_llm = _llm.with_structured_output(LocationPair)

    _prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "Extract the starting point (origin) and destination from the "
                "user's travel request. If no origin is mentioned, set origin "
                "to 'current location'.",
            ),
            ("human", "{message}"),
        ]
    )


def parse_locations(state: GeoAgentState) -> GeoAgentState:
    """Node 1: figure out origin_text and destination_text from the raw message."""
    message = state["user_message"]

    if USE_LLM:
        chain = _prompt | _structured_llm
        result = chain.invoke({"message": message})
        origin_text, destination_text = result.origin, result.destination
    else:
        match = re.search(r"from\s+(.+?)\s+to\s+(.+)", message, re.IGNORECASE)
        if match:
            origin_text, destination_text = (
                match.group(1).strip(),
                match.group(2).strip(),
            )
        else:
            origin_text, destination_text = "current location", message.strip()

    return {**state, "origin_text": origin_text, "destination_text": destination_text}


def geocode_both(state: GeoAgentState) -> GeoAgentState:
    """Node 2: turn origin_text/destination_text into lat/lon via Nominatim."""
    origin_geo = geocode_address(state["origin_text"])
    dest_geo = geocode_address(state["destination_text"])

    if not origin_geo or not dest_geo:
        missing = "origin" if not origin_geo else "destination"
        return {
            **state,
            "error": f"Couldn't find a location for the {missing}. Try a more specific place name.",
        }

    return {
        **state,
        "origin": {
            **origin_geo,
            "input_text": state["origin_text"],
            "nearest_stations": [],
        },
        "destination": {
            **dest_geo,
            "input_text": state["destination_text"],
            "nearest_stations": [],
        },
    }


def find_nearest_stations(state: GeoAgentState) -> GeoAgentState:
    """Node 3: attach nearest metro/transit hubs to both locations via Overpass."""
    origin = dict(state["origin"])
    destination = dict(state["destination"])

    print("Origin lat/lon:", origin["lat"], origin["lon"])

    origin["nearest_stations"] = find_nearest_transit_hubs(
        origin["lat"],
        origin["lon"],
    )
    print("Origin stations:", origin["nearest_stations"])

    destination["nearest_stations"] = find_nearest_transit_hubs(
        destination["lat"],
        destination["lon"],
    )
    print("Destination stations:", destination["nearest_stations"])

    return {
        **state,
        "origin": origin,
        "destination": destination,
    }


def route_after_geocode(state: GeoAgentState) -> str:
    """Conditional edge: skip station lookup entirely if geocoding failed."""
    return END if state.get("error") else "find_nearest_stations"


def build_geographic_agent_graph():
    graph = StateGraph(GeoAgentState)

    graph.add_node("parse_locations", parse_locations)
    graph.add_node("geocode_both", geocode_both)
    graph.add_node("find_nearest_stations", find_nearest_stations)

    graph.set_entry_point("parse_locations")
    graph.add_edge("parse_locations", "geocode_both")
    graph.add_conditional_edges(
        "geocode_both",
        route_after_geocode,
        {"find_nearest_stations": "find_nearest_stations", END: END},
    )
    graph.add_edge("find_nearest_stations", END)

    return graph.compile()


geographic_agent = build_geographic_agent_graph()


def run_geographic_agent(user_message: str) -> dict:
    """
    Public entry point. This is the ONLY function the UI/webhook layer
    should ever call — it hides the whole graph behind one call.

    Returns a dict matching GeoAgentState (see core/schema.py).
    """
    initial_state: GeoAgentState = {
        "user_message": user_message,
        "origin_text": None,
        "destination_text": None,
        "origin": None,
        "destination": None,
        "error": None,
    }
    return geographic_agent.invoke(initial_state)
