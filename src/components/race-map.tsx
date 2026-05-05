"use client"

import { useState, useEffect, useRef } from "react"
import Map, { Marker, Popup, MapRef } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"
import { DiscoverBar } from "@/components/discover-bar"
import { RaceCard } from "@/components/race-card"
import { Race } from "@/types/race"

const INITIAL_VIEW_STATE = {
  latitude: 20,
  longitude: 0,
  zoom: 1.5,
  pitch: 0,
  bearing: 0,
}

const MAP_STYLE = { width: "100%", height: "100%" }

interface RaceMapProps {
  races: Race[]
  focusedLocation: { latitude: number; longitude: number } | null
  onRaceAdded: (race: Race) => void
}

export function RaceMap({ races, focusedLocation, onRaceAdded }: RaceMapProps) {
  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const mapRef = useRef<MapRef>(null)
  const hasFitBounds = useRef(false)

  const racesWithCoords = races.filter(
    (r) => typeof r.latitude === "number" && typeof r.longitude === "number"
  )

  useEffect(() => {
    if (!mapLoaded || hasFitBounds.current || racesWithCoords.length === 0) return
    if (!mapRef.current) return

    if (racesWithCoords.length === 1) {
      const r = racesWithCoords[0]
      mapRef.current.flyTo({
        center: [r.longitude as number, r.latitude as number],
        zoom: 6,
        duration: 1500,
      })
    } else {
      const lons = racesWithCoords.map((r) => r.longitude as number)
      const lats = racesWithCoords.map((r) => r.latitude as number)
      const bounds: [[number, number], [number, number]] = [
        [Math.min(...lons), Math.min(...lats)],
        [Math.max(...lons), Math.max(...lats)],
      ]
      mapRef.current.fitBounds(bounds, { padding: 80, duration: 1500 })
    }
    hasFitBounds.current = true
  }, [mapLoaded, racesWithCoords])

  useEffect(() => {
    if (focusedLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [focusedLocation.longitude, focusedLocation.latitude],
        zoom: 10,
        duration: 2000,
      })
    }
  }, [focusedLocation])

  return (
    <div className="relative h-full w-full">
      <DiscoverBar onRaceAdded={onRaceAdded} />
      <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={mapboxToken}
        style={MAP_STYLE}
        pitch={0}
        minPitch={0}
        maxPitch={0}
        dragRotate={false}
        touchPitch={false}
        onLoad={() => setMapLoaded(true)}
      >
        {racesWithCoords.map((race) => {
          const isSelected = selectedRace?.id === race.id
          return (
            <Marker
              key={race.id}
              latitude={race.latitude as number}
              longitude={race.longitude as number}
              anchor="center"
              onClick={(event) => {
                event.originalEvent.stopPropagation()
                setSelectedRace(race)
              }}
            >
              <div
                className="race-marker group relative flex h-5 w-5 cursor-pointer items-center justify-center"
                aria-label={race.name}
                data-selected={isSelected || undefined}
              >
                <span className="race-marker-ping absolute h-5 w-5 rounded-full bg-red-500 opacity-0" />
                <span className="race-marker-dot relative block h-3 w-3 rounded-full border-2 border-white bg-red-500 shadow-md transition-colors" />
              </div>
            </Marker>
          )
        })}

        {selectedRace ? (
          <Popup
            latitude={selectedRace.latitude as number}
            longitude={selectedRace.longitude as number}
            anchor="top"
            closeOnClick={false}
            onClose={() => setSelectedRace(null)}
            maxWidth="320px"
            className="race-map-popup"
          >
            <div className="w-72">
              <RaceCard race={selectedRace} />
            </div>
          </Popup>
        ) : null}
      </Map>
    </div>
  )
}
