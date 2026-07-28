# backend/test_hubs.py

from backend.tools.transit_hub_tool import find_nearest_transit_hubs

stations = find_nearest_transit_hubs(13.0734496, 80.1948363)

print(stations)
