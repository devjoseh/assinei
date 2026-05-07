"use client"

import { usePwaInstall } from "@/hooks/use-pwa-install"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export function PwaInstallBanner() {
  const { canInstall, install, dismiss } = usePwaInstall()

  if (!canInstall) return null

  return (
    <div className="md:hidden mx-4 mt-3 flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
      <img
        src="/icons/icon-192x192.png"
        alt="Assinei"
        className="w-8 h-8 rounded-lg shrink-0"
      />
      <p className="text-xs text-muted-foreground flex-1 leading-snug">
        Instale o Assinei no seu celular para acesso rápido.
      </p>
      <Button
        size="sm"
        className="h-7 text-xs rounded-full px-3"
        onClick={install}
      >
        Instalar
      </Button>
      <button
        onClick={dismiss}
        className="text-muted-foreground hover:text-foreground shrink-0"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
