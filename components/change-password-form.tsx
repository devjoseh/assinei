"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Lock } from "lucide-react"
import { toast } from "sonner"

function passwordStrength(pw: string): { label: string; color: string; width: number } {
  if (pw.length < 8) return { label: "Fraca", color: "#E74C3C", width: 25 }

  const hasLetter = /[a-zA-Z]/.test(pw)
  const hasNumber = /\d/.test(pw)
  const hasSymbol = /[^a-zA-Z0-9]/.test(pw)

  if (hasLetter && hasNumber && hasSymbol)
    return { label: "Forte", color: "#27AE60", width: 100 }

  if (hasLetter && hasNumber)
    return { label: "Média", color: "#E67E22", width: 60 }

  return { label: "Fraca", color: "#E74C3C", width: 25 }
}

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentError, setCurrentError] = useState("")
  const [confirmError, setConfirmError] = useState("")
  const [confirmTouched, setConfirmTouched] = useState(false)

  const strength = passwordStrength(password)
  const isEmpty = !current || !password || !confirm
  const isMismatch = password !== confirm

  function validateConfirm() {
    setConfirmTouched(true)
    if (confirm && password !== confirm) {
      setConfirmError("As senhas não coincidem")
    } else {
      setConfirmError("")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCurrentError("")
    setConfirmError("")

    if (isMismatch) {
      setConfirmError("As senhas não coincidem")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: current,
          newPassword: password,
          confirmPassword: confirm,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === "Senha atual incorreta") {
          setCurrentError(data.error)
        } else {
          toast.error(data.error || "Erro ao alterar senha")
        }
        return
      }

      toast.success("Senha alterada com sucesso!")
      setCurrent("")
      setPassword("")
      setConfirm("")
      setConfirmTouched(false)
    } catch {
      toast.error("Erro ao alterar senha")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="current-pw">Senha atual</Label>
        <div className="relative">
          <Input
            id="current-pw"
            type={showCurrent ? "text" : "password"}
            value={current}
            onChange={(e) => { setCurrent(e.target.value); setCurrentError("") }}
            className="pr-9"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {currentError && (
          <p className="text-xs text-destructive">{currentError}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="new-pw">Nova senha</Label>
        <div className="relative">
          <Input
            id="new-pw"
            type={showNew ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-9"
            placeholder="Mínimo 8 caracteres"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {password.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${strength.width}%`, backgroundColor: strength.color }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground">{strength.label}</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm-pw">Confirmar nova senha</Label>
        <div className="relative">
          <Input
            id="confirm-pw"
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); if (confirmTouched) validateConfirm() }}
            onBlur={validateConfirm}
            className="pr-9"
            placeholder="Repita a nova senha"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {confirmTouched && confirmError && (
          <p className="text-xs text-destructive">{confirmError}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isEmpty || isMismatch || loading}
        className="w-full"
      >
        {loading ? "Alterando..." : "Alterar senha"}
      </Button>
    </form>
  )
}
