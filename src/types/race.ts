export interface Race {
  id: string | number
  name: string
  date: string
  location: string
  country: string | null
  distance: string | null
  type: string | null
  description: string | null
  image_url: string | null
  latitude: number | null
  longitude: number | null
}

export interface DiscoveredRace {
  name: string
  date: string
  location: string
  country: string | null
  distance: string
  certification: string | null
  image_url: string | null
  latitude: number | null
  longitude: number | null
  source_url: string
}
