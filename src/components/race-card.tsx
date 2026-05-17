import { Card, CardContent } from "@/components/ui/card"
import { Race } from "@/types/race"

export function RaceCard({ race }: { race: Race }) {
  const formattedDate = formatDate(race.date)
  const flag = getCountryFlag(race.country)

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-zinc-900">
              {race.name}
            </h3>
            <p className="mt-0.5 text-sm text-zinc-500">
              {race.location}
            </p>
          </div>
          {flag && (
            <span className="shrink-0 text-xl leading-none" aria-label={race.country ?? undefined}>
              {flag}
            </span>
          )}
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-sm text-zinc-500">
          <span className="whitespace-nowrap">{formattedDate}</span>
          {race.distance && (
            <>
              <span className="text-zinc-300">·</span>
              <span className="whitespace-nowrap">{race.distance}</span>
            </>
          )}
          {race.website_url && (
            <>
              <span className="text-zinc-300">·</span>
              <a
                href={race.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap text-blue-500 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Race page →
              </a>
            </>
          )}
        </div>
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

const COUNTRY_TO_CODE: Record<string, string> = {
  "Afghanistan": "AF", "Albania": "AL", "Algeria": "DZ", "Andorra": "AD",
  "Angola": "AO", "Argentina": "AR", "Armenia": "AM", "Australia": "AU",
  "Austria": "AT", "Azerbaijan": "AZ", "Bahamas": "BS", "Bahrain": "BH",
  "Bangladesh": "BD", "Belarus": "BY", "Belgium": "BE", "Bolivia": "BO",
  "Bosnia and Herzegovina": "BA", "Botswana": "BW", "Brazil": "BR",
  "Bulgaria": "BG", "Cambodia": "KH", "Cameroon": "CM", "Canada": "CA",
  "Chile": "CL", "China": "CN", "Colombia": "CO", "Costa Rica": "CR",
  "Croatia": "HR", "Cuba": "CU", "Cyprus": "CY", "Czech Republic": "CZ",
  "Czechia": "CZ", "Denmark": "DK", "Dominican Republic": "DO",
  "Ecuador": "EC", "Egypt": "EG", "El Salvador": "SV", "Estonia": "EE",
  "Ethiopia": "ET", "Finland": "FI", "France": "FR", "Georgia": "GE",
  "Germany": "DE", "Ghana": "GH", "Greece": "GR", "Guatemala": "GT",
  "Honduras": "HN", "Hong Kong": "HK", "Hungary": "HU", "Iceland": "IS",
  "India": "IN", "Indonesia": "ID", "Iran": "IR", "Iraq": "IQ",
  "Ireland": "IE", "Israel": "IL", "Italy": "IT", "Jamaica": "JM",
  "Japan": "JP", "Jordan": "JO", "Kazakhstan": "KZ", "Kenya": "KE",
  "Kuwait": "KW", "Latvia": "LV", "Lebanon": "LB", "Libya": "LY",
  "Liechtenstein": "LI", "Lithuania": "LT", "Luxembourg": "LU",
  "Malaysia": "MY", "Malta": "MT", "Mexico": "MX", "Moldova": "MD",
  "Monaco": "MC", "Mongolia": "MN", "Montenegro": "ME", "Morocco": "MA",
  "Mozambique": "MZ", "Myanmar": "MM", "Namibia": "NA", "Nepal": "NP",
  "Netherlands": "NL", "New Zealand": "NZ", "Nicaragua": "NI",
  "Nigeria": "NG", "North Macedonia": "MK", "Norway": "NO", "Oman": "OM",
  "Pakistan": "PK", "Palestine": "PS", "Panama": "PA", "Paraguay": "PY",
  "Peru": "PE", "Philippines": "PH", "Poland": "PL", "Portugal": "PT",
  "Qatar": "QA", "Romania": "RO", "Russia": "RU", "Rwanda": "RW",
  "Saudi Arabia": "SA", "Senegal": "SN", "Serbia": "RS",
  "Singapore": "SG", "Slovakia": "SK", "Slovenia": "SI",
  "South Africa": "ZA", "South Korea": "KR", "Spain": "ES",
  "Sri Lanka": "LK", "Sudan": "SD", "Sweden": "SE", "Switzerland": "CH",
  "Syria": "SY", "Taiwan": "TW", "Tanzania": "TZ", "Thailand": "TH",
  "Trinidad and Tobago": "TT", "Tunisia": "TN", "Turkey": "TR",
  "Türkiye": "TR", "Uganda": "UG", "Ukraine": "UA",
  "United Arab Emirates": "AE", "UAE": "AE",
  "United Kingdom": "GB", "UK": "GB",
  "United States": "US", "United States of America": "US", "USA": "US", "US": "US",
  "Uruguay": "UY", "Uzbekistan": "UZ", "Venezuela": "VE",
  "Vietnam": "VN", "Yemen": "YE", "Zambia": "ZM", "Zimbabwe": "ZW",
}

function getCountryFlag(country: string | null): string | null {
  if (!country) return null
  const code = COUNTRY_TO_CODE[country] ?? COUNTRY_TO_CODE[country.trim()]
  if (!code) return null
  return String.fromCodePoint(
    ...code.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  )
}
