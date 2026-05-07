"use client"

import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
}

type TagSuggestion = { _id: string; tag: string; usageCount: number }

const MAX_TAGS = 10

export function TagInput({ value, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const isAtLimit = value.length >= MAX_TAGS

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then((data) => setSuggestions(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const filtered = suggestions.filter(
    (s) =>
      (!inputValue.trim() || s.tag.includes(inputValue.trim().toLowerCase())) &&
      !value.includes(s.tag)
  )

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().slice(0, 30)
    if (!tag || value.includes(tag) || isAtLimit) return
    onChange([...value, tag])
    setInputValue("")
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (val.includes(",")) {
      const [before, ...rest] = val.split(",")
      if (before.trim()) addTag(before)
      setInputValue(rest.join(",").trimStart())
    } else {
      setInputValue(val)
    }
    setShowDropdown(true)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      if (inputValue.trim()) addTag(inputValue)
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex flex-wrap gap-1.5 min-h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm cursor-text",
          "focus-within:ring-2 focus-within:ring-ring transition-shadow"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-xs font-medium shrink-0"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              className="text-muted-foreground hover:text-foreground leading-none"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {!isAtLimit && (
          <input
            ref={inputRef}
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowDropdown(true)}
            placeholder={value.length === 0 ? "Ex: streaming, pessoal..." : ""}
            className="flex-1 min-w-20 bg-transparent outline-none placeholder:text-muted-foreground text-sm"
          />
        )}
      </div>

      {showDropdown && filtered.length > 0 && !isAtLimit && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-lg border border-border bg-popover shadow-md overflow-hidden">
          {filtered.slice(0, 8).map((s) => (
            <button
              key={s._id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center justify-between"
              onMouseDown={(e) => { e.preventDefault(); addTag(s.tag) }}
            >
              <span>{s.tag}</span>
            </button>
          ))}
        </div>
      )}

      {isAtLimit && (
        <p className="text-xs text-muted-foreground mt-1">Limite de 10 tags atingido.</p>
      )}
    </div>
  )
}
