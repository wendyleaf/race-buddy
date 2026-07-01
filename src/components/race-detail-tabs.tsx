"use client"

import { useState } from "react"
import { BookOpenText, ClipboardList, Dumbbell } from "lucide-react"
import { BuildTab } from "@/components/build-tab"
import { LogisticsTab } from "@/components/logistics-tab"
import { DiaryEntryCard, DiaryEntryForm } from "@/components/diary"
import { cn } from "@/lib/utils"
import { DiaryEntry, LogisticsItem, Race, Workout } from "@/types"

type TabKey = "build" | "logistics" | "journal"

export function RaceDetailTabs({
  race,
  workouts,
  logistics,
  entries,
}: {
  race: Race
  workouts: Workout[]
  logistics: LogisticsItem[]
  entries: DiaryEntry[]
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("build")

  const tabs: { key: TabKey; label: string; icon: typeof Dumbbell; count: number }[] =
    [
      { key: "build", label: "Build", icon: Dumbbell, count: workouts.length },
      {
        key: "logistics",
        label: "Logistics",
        icon: ClipboardList,
        count: logistics.length,
      },
      {
        key: "journal",
        label: "Journal",
        icon: BookOpenText,
        count: entries.length,
      },
    ]

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              activeTab === key
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            )}
          >
            <Icon className="size-4" />
            {label}
            {count > 0 && (
              <span className="rounded-full bg-zinc-100 px-1.5 text-xs text-zinc-600">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "build" && (
        <BuildTab raceId={race.id} raceDate={race.race_date} workouts={workouts} />
      )}
      {activeTab === "logistics" && (
        <LogisticsTab raceId={race.id} items={logistics} />
      )}
      {activeTab === "journal" && (
        <div className="space-y-4">
          <DiaryEntryForm raceId={race.id} />
          {entries.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No entries yet for this build. Jot down how training is going.
            </p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <DiaryEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
