"use client"

import { useEffect, useMemo, useState } from "react"

type CountdownParts = {
  totalMs: number
  dias: number
  horas: number
  minutos: number
  segundos: number
}

const DEFAULT_TARGET_DATE_MS = Date.UTC(2026, 3, 10, 21, 0, 0) // 2026-04-10 16:00 Colombia (UTC-5)

function getRemainingTime(nowMs: number, targetMs: number): CountdownParts {
  const totalMs = Math.max(targetMs - nowMs, 0)

  const totalSeconds = Math.floor(totalMs / 1000)
  const dias = Math.floor(totalSeconds / 86400)
  const horas = Math.floor((totalSeconds % 86400) / 3600)
  const minutos = Math.floor((totalSeconds % 3600) / 60)
  const segundos = totalSeconds % 60

  return { totalMs, dias, horas, minutos, segundos }
}

function pad(value: number) {
  return String(value).padStart(2, "0")
}

export function CountdownTimer() {
  const [nowMs, setNowMs] = useState<number | null>(null)
  const [targetMs, setTargetMs] = useState(DEFAULT_TARGET_DATE_MS)
  const [enabled, setEnabled] = useState(true)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/retiro-settings", { cache: "no-store" })
        if (!response.ok) throw new Error("No fue posible cargar configuración")

        const data = await response.json()
        if (typeof data?.countdown_enabled === "boolean") {
          setEnabled(data.countdown_enabled)
        }

        if (typeof data?.retiro_datetime === "string") {
          const parsed = Date.parse(data.retiro_datetime)
          if (!Number.isNaN(parsed)) setTargetMs(parsed)
        }
      } catch (error) {
        // fallback silently to defaults
      } finally {
        setIsReady(true)
      }
    }

    void loadSettings()
    setNowMs(Date.now())
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const remaining = useMemo(() => {
    if (nowMs === null) {
      return { totalMs: 0, dias: 0, horas: 0, minutos: 0, segundos: 0 }
    }
    return getRemainingTime(nowMs, targetMs)
  }, [nowMs, targetMs])

  if (!isReady || !enabled) return null

  return (
    <div className="w-full max-w-xl rounded-xl border bg-card p-4">
      <p className="text-center text-sm font-medium text-muted-foreground mb-3">Faltan para el retiro</p>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="rounded-lg bg-secondary p-3">
          <div className="text-xl font-bold leading-none">{remaining.dias}</div>
          <div className="text-xs text-muted-foreground mt-1">Días</div>
        </div>
        <div className="rounded-lg bg-secondary p-3">
          <div className="text-xl font-bold leading-none">{pad(remaining.horas)}</div>
          <div className="text-xs text-muted-foreground mt-1">Horas</div>
        </div>
        <div className="rounded-lg bg-secondary p-3">
          <div className="text-xl font-bold leading-none">{pad(remaining.minutos)}</div>
          <div className="text-xs text-muted-foreground mt-1">Min</div>
        </div>
        <div className="rounded-lg bg-secondary p-3">
          <div className="text-xl font-bold leading-none">{pad(remaining.segundos)}</div>
          <div className="text-xs text-muted-foreground mt-1">Seg</div>
        </div>
      </div>
      {remaining.totalMs === 0 && (
        <p className="text-center text-sm text-primary mt-3 font-medium">El retiro ya inició.</p>
      )}
    </div>
  )
}
