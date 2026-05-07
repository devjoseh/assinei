"use client"

import { CATEGORIES, CATEGORY_COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CategoryFilterProps {
  selected: string[]
  onChange: (categories: string[]) => void
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  function toggle(cat: string) {
    if (selected.includes(cat)) {
      onChange(selected.filter((c) => c !== cat))
    } else {
      onChange([...selected, cat])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selected.length === 0 ? "default" : "outline"}
        size="sm"
        onClick={() => onChange([])}
        className="h-7 text-xs rounded-full"
      >
        Todas
      </Button>
      {CATEGORIES.map((cat) => {
        const isActive = selected.includes(cat)
        const color = CATEGORY_COLORS[cat] || "#8C8C8C"
        return (
          <button
            key={cat}
            onClick={() => toggle(cat)}
            className={cn(
              "h-7 px-3 text-xs rounded-full border transition-all font-medium",
              isActive
                ? "border-transparent text-white"
                : "border-border text-muted-foreground hover:border-current hover:text-foreground bg-background"
            )}
            style={isActive ? { backgroundColor: color, borderColor: color } : { color: isActive ? "white" : undefined }}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
