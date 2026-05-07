"use client"

import { useState, useEffect } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(true)
  const [dismissed, setDismissed] = useState(true) // start true to avoid flash

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches)
    setDismissed(localStorage.getItem("pwa-banner-dismissed") === "true")

    function handleBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
  }, [])

  const canInstall = !!deferredPrompt && !isStandalone && !dismissed

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    if (choice.outcome === "accepted") {
      setIsStandalone(true)
    }
  }

  function dismiss() {
    localStorage.setItem("pwa-banner-dismissed", "true")
    setDismissed(true)
  }

  return { canInstall, install, dismiss }
}
