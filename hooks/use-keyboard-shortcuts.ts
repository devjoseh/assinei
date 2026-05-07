"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

interface KeyboardShortcutsOptions {
  searchInputRef: React.RefObject<HTMLInputElement | null>
  categories: string[]
  onSelectCategory: (index: number) => void
  onToggleView: () => void
  onNewSubscription: () => void
  onOpenShortcuts: () => void
  disabled: boolean
}

export function useKeyboardShortcuts({
  searchInputRef,
  categories,
  onSelectCategory,
  onToggleView,
  onNewSubscription,
  onOpenShortcuts,
  disabled,
}: KeyboardShortcutsOptions) {
  const router = useRouter()
  const gKeyPressed = useRef(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (disabled) return

      const target = e.target as HTMLElement
      const tag = target.tagName.toLowerCase()
      const isEditable = tag === "input" || tag === "textarea" || target.isContentEditable

      // Ignore shortcuts when typing in inputs, except Escape
      if (isEditable && e.key !== "Escape") return

      // G-prefix sequences (Vim-style)
      if (e.key === "g" && !isEditable) {
        gKeyPressed.current = true
        // Reset after 1s if no follow-up key
        setTimeout(() => { gKeyPressed.current = false }, 1000)
        return
      }

      if (gKeyPressed.current) {
        gKeyPressed.current = false
        if (e.key === "d") {
          e.preventDefault()
          router.push("/dashboard")
          return
        }
        if (e.key === "c") {
          e.preventDefault()
          router.push("/dashboard/settings")
          return
        }
        return
      }

      // Single-key shortcuts
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault()
        onOpenShortcuts()
        return
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault()
        onNewSubscription()
        return
      }

      if (e.key === "v" || e.key === "V") {
        e.preventDefault()
        onToggleView()
        return
      }

      if (e.key === "f" || e.key === "F") {
        e.preventDefault()
        const input = searchInputRef.current
        if (input) {
          input.focus()
          input.select()
        }
        return
      }

      // 1-9: select filter pill
      const digit = parseInt(e.key)
      if (digit >= 1 && digit <= 9) {
        e.preventDefault()
        // 1 = Todas (index 0), 2 = first category (index 0 in categories array)
        if (digit === 1) {
          onSelectCategory(-1) // -1 means "Todas" / clear selection
        } else {
          const catIndex = digit - 2
          if (catIndex < categories.length) {
            onSelectCategory(catIndex)
          }
        }
      }
    }

    // Reset g-key on blur (user switched windows)
    function handleBlur() {
      gKeyPressed.current = false
    }

    document.addEventListener("keydown", handleKeyDown)
    window.addEventListener("blur", handleBlur)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("blur", handleBlur)
    }
  }, [disabled, categories, searchInputRef, onSelectCategory, onToggleView, onNewSubscription, onOpenShortcuts, router])
}
