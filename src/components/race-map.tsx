"use client"

import { useState } from "react"
import Map, { Marker, Popup } from "react-map-gl/mapbox"

const INITIAL_VIEW_STATE = {
  latitude: 40.7128,
  longitude: -74.0060,
  zoom: 12,
  pitch: 0,
  bearing: 0,
}

const MAP_STYLE = { width: "100%", height: "100%" }

export function RaceMap({ races }: RaceMapProps) {
  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  return (
    <div className="h-full w-full">
      <Map
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={mapboxToken}
        style={MAP_STYLE}
        pitch={0}
        minPitch={0}
        maxPitch={0}
        dragRotate={false}
        touchPitch={false}
      >
        {races
          .filter((race) => typeof race.latitude === "number")
          .filter((race) => typeof race.longitude === "number")
          .map((race) => (
            <Marker
              key={race.id}
              latitude={race.latitude as number}
              longitude={race.longitude as number}
              anchor="bottom"
              onClick={(event) => {
                event.originalEvent.stopPropagation()
                setSelectedRace(race)
              }}
            >
              <div className="h-3 w-3 rounded-full bg-red-500 shadow" />
            </Marker>
          ))}

        {selectedRace ? (
          <Popup
            latitude={selectedRace.latitude as number}
            longitude={selectedRace.longitude as number}
            anchor="top"
            closeOnClick={false}
            onClose={() => setSelectedRace(null)}
          >
            <div className="text-sm font-medium">{selectedRace.name}</div>
          </Popup>
        ) : null}
      </Map>
    </div>
  )
}

interface RaceMapProps {
  races: Race[]
}

interface Race {
  id: string | number
  name: string
  latitude: number | null
  longitude: number | null
}
