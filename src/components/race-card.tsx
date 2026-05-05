import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Race } from "@/types/race"

const FALLBACK_IMAGE = "/file.svg"

export function RaceCard({ race }: { race: Race }) {
  const formattedDate = formatDate(race.date)
  const imageUrl = race.image_url ?? FALLBACK_IMAGE
  const badgeText = race.distance ?? "Race"
  const locationText = race.country
    ? `${race.location}, ${race.country}`
    : race.location

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative h-44 w-full">
        <Image
          src={imageUrl}
          alt={race.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
          unoptimized={imageUrl === FALLBACK_IMAGE}
        />
        <Badge className="absolute right-3 top-3">{badgeText}</Badge>
      </div>
      <CardContent className="space-y-2">
        <h3 className="text-lg font-semibold text-zinc-900">{race.name}</h3>
        <p className="text-sm text-zinc-600">{formattedDate}</p>
        <p className="text-sm text-zinc-600">{locationText}</p>
      </CardContent>
    </Card>
  )
}

function formatDate(dateString: string) {
  const parsed = new Date(dateString)
  if (Number.isNaN(parsed.getTime())) return dateString
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed)
}
