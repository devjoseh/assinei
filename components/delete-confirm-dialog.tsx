"use client"

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
import { Subscription } from "@/types"

interface DeleteConfirmDialogProps {
  subscription: Subscription | null
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialog({ subscription, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={!!subscription}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir assinatura</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir <strong>{subscription?.name}</strong>? Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
