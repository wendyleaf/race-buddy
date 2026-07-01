"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  BedDouble,
  CalendarClock,
  ExternalLink,
  Package,
  Plane,
  Plus,
  StickyNote,
  Ticket,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LOGISTICS_CATEGORIES } from "@/lib/constants"
import { createRecord, deleteRecord, updateRecord } from "@/lib/api"
import { formatDateTime } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { LogisticsCategory, LogisticsItem } from "@/types"

const CATEGORY_ICONS: Record<LogisticsCategory, typeof BedDouble> = {
  hotel: BedDouble,
  travel: Plane,
  expo: Ticket,
  schedule: CalendarClock,
  gear: Package,
  other: StickyNote,
}

export function LogisticsTab({
  raceId,
  items,
}: {
  raceId: string
  items: LogisticsItem[]
}) {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)

  const categories = Object.keys(LOGISTICS_CATEGORIES) as LogisticsCategory[]
  const grouped = categories
    .map((category) => ({
      category,
      items: items.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-600">
          {items.length > 0
            ? `${items.filter((i) => i.done).length} of ${items.length} items checked off`
            : "Track hotel, travel, expo, schedule, and gear for race weekend."}
        </p>
        <Button size="sm" onClick={() => setIsAdding((prev) => !prev)}>
          <Plus /> Add item
        </Button>
      </div>

      {isAdding && (
        <AddLogisticsForm
          raceId={raceId}
          onDone={() => {
            setIsAdding(false)
            router.refresh()
          }}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {grouped.map(({ category, items: categoryItems }) => {
        const Icon = CATEGORY_ICONS[category]
        return (
          <section key={category} className="space-y-2">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
              <Icon className="size-4 text-zinc-500" />
              {LOGISTICS_CATEGORIES[category]}
            </h3>
            <div className="space-y-1.5">
              {categoryItems.map((item) => (
                <LogisticsItemRow
                  key={item.id}
                  item={item}
                  onChanged={() => router.refresh()}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function LogisticsItemRow({
  item,
  onChanged,
}: {
  item: LogisticsItem
  onChanged: () => void
}) {
  const [isBusy, setIsBusy] = useState(false)

  async function handleToggle() {
    setIsBusy(true)
    try {
      await updateRecord("logistics", item.id, { done: !item.done })
      onChanged()
    } finally {
      setIsBusy(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${item.title}"?`)) return
    setIsBusy(true)
    try {
      await deleteRecord("logistics", item.id)
      onChanged()
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="group flex items-start gap-3 rounded-lg border bg-white px-3 py-2.5">
      <input
        type="checkbox"
        checked={item.done}
        onChange={handleToggle}
        disabled={isBusy}
        className="mt-0.5 size-4 accent-emerald-600"
        aria-label={`Mark "${item.title}" as done`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium text-zinc-800",
            item.done && "text-zinc-400 line-through"
          )}
        >
          {item.title}
        </p>
        {item.details && (
          <p className="text-sm whitespace-pre-wrap text-zinc-500">
            {item.details}
          </p>
        )}
        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          {item.item_date && <span>{formatDateTime(item.item_date)}</span>}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-0.5 text-blue-600 hover:underline"
            >
              <ExternalLink className="size-3" /> Link
            </a>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleDelete}
        disabled={isBusy}
        className="text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
        aria-label={`Delete "${item.title}"`}
      >
        <Trash2 />
      </Button>
    </div>
  )
}

function AddLogisticsForm({
  raceId,
  onDone,
  onCancel,
}: {
  raceId: string
  onDone: () => void
  onCancel: () => void
}) {
  const [category, setCategory] = useState<LogisticsCategory>("hotel")
  const [title, setTitle] = useState("")
  const [details, setDetails] = useState("")
  const [itemDate, setItemDate] = useState("")
  const [url, setUrl] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required")
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      await createRecord("logistics", {
        race_id: raceId,
        category,
        title: title.trim(),
        details: details || null,
        item_date: itemDate ? new Date(itemDate).toISOString() : null,
        url: url || null,
      })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-white p-4">
      <h3 className="text-sm font-semibold text-zinc-900">New logistics item</h3>
      <div className="flex flex-wrap gap-3">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as LogisticsCategory)}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LOGISTICS_CATEGORIES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="logistics-date">Date / time (optional)</Label>
          <Input
            id="logistics-date"
            type="datetime-local"
            value={itemDate}
            onChange={(e) => setItemDate(e.target.value)}
            className="w-56"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="logistics-title">Title</Label>
        <Input
          id="logistics-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Hampton Inn — confirmation #ABC123"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="logistics-details">Details (optional)</Label>
        <Textarea
          id="logistics-details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Check-in 3pm, 0.4mi from start corrals"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="logistics-url">Link (optional)</Label>
        <Input
          id="logistics-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving…" : "Add item"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
