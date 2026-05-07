"use client"

import { useState, useEffect } from "react"
import { ImageHistory } from "@/types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageHistoryPickerProps {
  value: string
  onChange: (url: string) => void
  label?: string
}

export function ImageHistoryPicker({ value, onChange, label = "URL da imagem" }: ImageHistoryPickerProps) {
  const [history, setHistory] = useState<ImageHistory[]>([])
  const [open, setOpen] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    fetch("/api/image-history")
      .then((r) => r.json())
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [open])

  function handleSelect(url: string) {
    onChange(url)
    setImgError(false)
    setOpen(false)
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://..."
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setImgError(false)
          }}
          className="flex-1"
        />
        {history.length > 0 && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              title="Histórico de imagens"
            >
              <History className="h-4 w-4" />
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2" align="end">
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Histórico de imagens</p>
              <ScrollArea className="h-48">
                <div className="grid grid-cols-4 gap-1.5">
                  {history.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => handleSelect(item.url)}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden border-2 hover:border-primary transition-colors",
                        value === item.url ? "border-primary" : "border-border"
                      )}
                      title={item.label || item.url}
                    >
                      <img
                        src={item.url}
                        alt={item.label}
                        className="w-full h-full object-contain bg-white p-0.5"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = "none"
                        }}
                      />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {value && !imgError && (
        <div className="mt-2 relative w-16 h-16 rounded-xl overflow-hidden border border-border bg-white">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-contain p-1"
            onError={() => setImgError(true)}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-0.5 right-0.5 bg-background rounded-full p-0.5 border border-border"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      )}
      {imgError && value && (
        <p className="text-xs text-destructive">Imagem não pôde ser carregada</p>
      )}
    </div>
  )
}
