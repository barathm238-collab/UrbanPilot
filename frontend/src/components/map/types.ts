export type SearchResult = {
  place_id: number
  display_name: string
  lat: number
  lon: number
}

export type OsrmRoute = {
  distanceMeters: number
  durationSeconds: number
  geometry: [number, number][]   // [lat, lng] pairs
}
