const BASE_URL = "http://127.0.0.1:8000";

export async function runGeographicAgent(message: string) {
  const response = await fetch(`${BASE_URL}/api/geographic`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
    }),
  });

  if (!response.ok) {
    throw new Error("Backend request failed");
  }

  return await response.json();
}

export async function runRouteOptionsAgent(geo: unknown) {
  const response = await fetch(`${BASE_URL}/api/route-options`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      geo,
    }),
  });

  if (!response.ok) {
    throw new Error("Route Options request failed");
  }

  return await response.json();
}