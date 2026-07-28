import apiClient from './apiClient'

export type Coordinate = {
  lat: number
  lng: number
}

export type EnvironmentAnalyzeRequest = {
  origin: Coordinate
  destination: Coordinate
  departureTime?: string
}

export type WeatherImpact = {
  condition: string
  temperature: number
  humidity: number
  windSpeed: number
  visibility?: number
  rain?: boolean
  description?: string
}

export type TrafficImpact = {
  level: string
  delayMinutes: number
  averageSpeed: number
  roadIncidents?: Array<Record<string, unknown>>
}

export type TravelImpact = {
  walkingComfort: string
  bikeComfort: string
  recommendedTransport: string
  reason: string
}

export type EnvironmentAnalyzeResponse = {
  weather: WeatherImpact
  traffic: TrafficImpact
  recommendation: TravelImpact
  travelImpact: TravelImpact
}

// Backend may return travelImpact or recommendation — accept both
type RawResponse = {
  weather: WeatherImpact
  traffic: TrafficImpact
  recommendation?: TravelImpact
  travelImpact?: TravelImpact
}

export async function analyzeEnvironment(
  payload: EnvironmentAnalyzeRequest,
): Promise<EnvironmentAnalyzeResponse> {
  const { data } = await apiClient.post<RawResponse>('/environment/analyze', payload)

  const recommendation = data.recommendation ?? data.travelImpact

  if (!data.weather || !data.traffic || !recommendation) {
    throw new Error('Backend returned an incomplete response — missing weather, traffic, or recommendation.')
  }

  return {
    weather: data.weather,
    traffic: data.traffic,
    recommendation,
    travelImpact: recommendation,
  }
}
