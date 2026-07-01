"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpenText, Flag, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/races", label: "Races", icon: Flag },
  { href: "/diary", label: "Diary", icon: BookOpenText },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-6 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-zinc-900">
          🏃 Race Buddy
        </Link>
        <nav className="flex items-center gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
