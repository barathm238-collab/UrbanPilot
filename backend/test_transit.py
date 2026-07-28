import json
import inspect

from backend.agents.geographic_agent import run_geographic_agent
from backend.agents.route_options_agent import generate_route_options
import backend.agents.transit_agent as ta

print(inspect.signature(ta.run_transit_agent))
print("Imported module:", ta.__file__)
print("Function:", ta.run_transit_agent)

geo = run_geographic_agent("I want to travel from Koyambedu to Vadapalani")

print("\n===== GEO OUTPUT =====")
print(json.dumps(geo, indent=2))

routes = generate_route_options(geo)

print("\n===== ROUTE OPTIONS =====")
print(json.dumps(routes, indent=2))

result = ta.run_transit_agent(routes)

print("\n===== AFTER TRANSIT =====")
print(json.dumps(result, indent=2))
