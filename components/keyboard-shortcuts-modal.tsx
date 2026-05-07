"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const SHORTCUTS = [
  { key: "N", description: "Nova assinatura" },
  { key: "F", description: "Focar na busca" },
  { key: "V", description: "Alternar grade/lista" },
  { key: "G D", description: "Ir para Dashboard" },
  { key: "G C", description: "Ir para Configurações" },
  { key: "1 – 9", description: "Filtrar por categoria" },
  { key: "Esc", description: "Fechar modal" },
  { key: "?", description: "Mostrar atalhos" },
]

interface KeyboardShortcutsModalProps {
  open: boolean
  onClose: () => void
}

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Atalhos de Teclado</DialogTitle>
        </DialogHeader>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {SHORTCUTS.map((s) => (
                <tr key={s.key} className="hover:bg-muted/50 transition-colors">
                  <td className="py-2 pl-3 pr-2">
                    <kbd className="inline-block rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                      {s.key}
                    </kbd>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{s.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Os atalhos são desativados quando um campo de texto está em foco.
        </p>
      </DialogContent>
    </Dialog>
  )
}
