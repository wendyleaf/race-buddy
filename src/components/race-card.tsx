import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

export function RaceCard({ race }: RaceCardProps) {
  const formattedDate = formatDate(race.date)
  const imageUrl = race.image_url ?? "/file.svg"
  const badgeText = race.distance ?? "Race"
  const locationText = race.country
    ? `${race.location}, ${race.country}`
    : race.location

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <img
          src={imageUrl}
          alt={race.name}
          className="h-44 w-full object-cover"
          loading="lazy"
        />
        <Badge className="absolute right-3 top-3">{badgeText}</Badge>
      </div>
      <CardContent className="space-y-2">
        <h3 className="text-lg font-semibold text-zinc-900">{race.name}</h3>
        <p className="text-sm text-zinc-600">{formattedDate}</p>
        <p className="text-sm text-zinc-600">{locationText}</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View Details</Button>
      </CardFooter>
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

interface RaceCardProps {
  race: Race
}

interface Race {
  id: string | number
  name: string
  date: string
  location: string
  country: string | null
  distance: string | null
  type: string | null
  description: string | null
  image_url: string | null
}
