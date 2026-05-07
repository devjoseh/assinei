"use client"

import { useEffect, useState } from "react"
import { Subscription } from "@/types"
import { formatCurrency } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

type Payment = {
  _id: string
  amount: number
  paidAt: string
  notes?: string
}

interface PaymentHistoryDrawerProps {
  subscription: Subscription | null
  onClose: () => void
}

export function PaymentHistoryDrawer({ subscription, onClose }: PaymentHistoryDrawerProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!subscription) return
    setPayments([])
    setLoading(true)

    fetch(`/api/payments?subscriptionId=${subscription._id}`)
      .then((r) => r.json())
      .then((data) => setPayments(data))
      .catch(() => toast.error("Erro ao carregar histórico."))
      .finally(() => setLoading(false))
  }, [subscription])

  async function handleDelete() {
    if (!confirmDeleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/payments/${confirmDeleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setPayments((prev) => prev.filter((p) => p._id !== confirmDeleteId))
      toast.success("Registro removido.")
    } catch {
      toast.error("Erro ao remover registro.")
    } finally {
      setDeleting(false)
      setConfirmDeleteId(null)
    }
  }

  const total = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <>
      <Sheet open={!!subscription} onOpenChange={(open) => { if (!open) onClose() }}>
        <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-0 gap-0">
          <SheetHeader className="border-b px-4 py-4">
            <SheetTitle>Histórico — {subscription?.name}</SheetTitle>
            <SheetDescription>Pagamentos registrados para esta assinatura</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))
            ) : payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
                <p className="text-sm font-medium text-foreground">Nenhum pagamento registrado</p>
                <p className="text-xs text-muted-foreground">
                  Use o botão <span className="font-medium">$</span> no card para registrar um pagamento.
                </p>
              </div>
            ) : (
              payments.map((payment) => (
                <div
                  key={payment._id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium text-foreground">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(payment.paidAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    {payment.notes && (
                      <p className="text-xs text-muted-foreground truncate">{payment.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmDeleteId(payment._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {!loading && payments.length > 0 && (
            <SheetFooter className="border-t px-4 py-3">
              <div className="flex items-center justify-between w-full text-sm">
                <span className="text-muted-foreground">Total registrado</span>
                <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!confirmDeleteId}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover registro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este registro de pagamento? Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDeleteId(null)} disabled={deleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
