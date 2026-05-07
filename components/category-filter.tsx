"use client"

import { useCategories } from "@/components/categories-provider"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Currency } from "@/types"

interface CategoryFilterProps {
  selected: string[]
  onChange: (categories: string[]) => void
  breakdown?: Array<{ category: string; currency: string; total: number; count: number }>
}

export function CategoryFilter({ selected, onChange, breakdown }: CategoryFilterProps) {
  const { categories, loading } = useCategories()

  function toggle(cat: string) {
    if (selected.includes(cat)) {
      onChange(selected.filter((c) => c !== cat))
    } else {
      onChange([...selected, cat])
    }
  }

  const breakdownByCategory = new Map<string, Array<{ currency: string; total: number }>>()
  if (breakdown) {
    for (const entry of breakdown) {
      if (!breakdownByCategory.has(entry.category)) breakdownByCategory.set(entry.category, [])
      breakdownByCategory.get(entry.category)!.push({ currency: entry.currency, total: entry.total })
    }
  }

  const grandTotal = breakdown
    ? breakdown.reduce((sum, e) => sum + e.total, 0)
    : 0

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-16 rounded-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selected.length === 0 ? "default" : "outline"}
        size="sm"
        onClick={() => onChange([])}
        className="h-auto py-1.5 text-xs rounded-full"
      >
        <div className="flex flex-col items-center leading-tight">
          <span className="font-medium">Todas</span>
          {breakdown && (
            <span
              className={cn(
                "text-[10px]",
                selected.length === 0 ? "text-white/70" : "text-muted-foreground"
              )}
            >
              {formatCurrency(grandTotal)}
            </span>
          )}
        </div>
      </Button>
      {categories.map((cat) => {
        const isActive = selected.includes(cat.name)
        const amounts = breakdownByCategory.get(cat.name)
        return (
          <button
            key={cat._id}
            onClick={() => toggle(cat.name)}
            className={cn(
              "h-auto py-1.5 px-3 text-xs rounded-full border transition-all font-medium inline-flex flex-col items-center leading-tight",
              isActive
                ? "border-transparent text-white"
                : "border-border text-muted-foreground hover:border-current hover:text-foreground bg-background"
            )}
            style={isActive ? { backgroundColor: cat.color, borderColor: cat.color } : undefined}
          >
            <span className="inline-flex items-center gap-1">
              {cat.icon && <span>{cat.icon}</span>}
              {cat.name}
            </span>
            {breakdown && (
              <span
                className={cn(
                  "text-[10px]",
                  isActive ? "text-white/70" : "text-muted-foreground"
                )}
              >
                {amounts && amounts.length > 1
                  ? formatCurrency(amounts.reduce((s, a) => s + a.total, 0))
                  : amounts?.[0]
                    ? formatCurrency(amounts[0].total, amounts[0].currency as Currency)
                    : formatCurrency(0)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
