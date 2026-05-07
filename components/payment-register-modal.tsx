"use client"

import { useEffect, useState } from "react"
import { Subscription } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { BILLING_CYCLE_LABELS } from "@/lib/constants"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface PaymentRegisterModalProps {
  subscription: Subscription | null
  onClose: () => void
}

export function PaymentRegisterModal({ subscription, onClose }: PaymentRegisterModalProps) {
  const [paidAt, setPaidAt] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (subscription) {
      setPaidAt(new Date().toISOString().split("T")[0])
      setNotes("")
    }
  }, [subscription])

  const today = new Date().toISOString().split("T")[0]

  async function handleSubmit() {
    if (!subscription) return
    setLoading(true)
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: subscription._id,
          paidAt,
          ...(notes ? { notes } : {}),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Pagamento registrado!")
      onClose()
    } catch {
      toast.error("Erro ao registrar pagamento.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!subscription} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          {subscription && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{subscription.name}</span>
              {" · "}
              {formatCurrency(subscription.price)}
              {" · "}
              {BILLING_CYCLE_LABELS[subscription.billingCycle].toLowerCase()}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="paidAt">Data do pagamento</Label>
            <input
              id="paidAt"
              type="date"
              value={paidAt}
              max={today}
              onChange={(e) => setPaidAt(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">
              Observações{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="Ex: pago via cartão de crédito..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{notes.length}/200</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !paidAt}>
            {loading ? "Registrando..." : "Confirmar pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
