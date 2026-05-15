"use client"

import { useEffect, useState } from "react"

const EXCHANGE_STORAGE_KEY = "bambucha_average_exchange_rate"
const REFRESH_TIME = 30 * 60 * 1000 // 30 minutos

type ExchangeRateState = {
  rate: number
  averageRate: number | null
  dollarRate: number | null
  euroRate: number | null
  source: string
  updatedAt: string | null
  dollarUpdatedAt: string | null
  euroUpdatedAt: string | null
  loading: boolean
  error: string | null
}

const initialState: ExchangeRateState = {
  rate: 0,
  averageRate: null,
  dollarRate: null,
  euroRate: null,
  source: "Promedio entre dólar oficial BCV y euro oficial BCV",
  updatedAt: null,
  dollarUpdatedAt: null,
  euroUpdatedAt: null,
  loading: true,
  error: null,
}

function isValidRate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
}

export function useExchangeRate() {
  const [exchange, setExchange] = useState<ExchangeRateState>(initialState)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(EXCHANGE_STORAGE_KEY)

      if (saved) {
        const parsed = JSON.parse(saved)

        if (isValidRate(parsed.rate)) {
          setExchange({
            ...initialState,
            ...parsed,
            loading: false,
            error: null,
          })
        }
      }
    } catch {
      localStorage.removeItem(EXCHANGE_STORAGE_KEY)
    }

    async function loadExchangeRate() {
      try {
        setExchange((current) => ({
          ...current,
          loading: true,
          error: null,
        }))

        const response = await fetch("/api/exchange-rate", {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("No se pudo actualizar la tasa.")
        }

        const data = await response.json()

        if (!isValidRate(data.rate)) {
          throw new Error("La tasa recibida no es válida.")
        }

        const nextExchange: ExchangeRateState = {
          rate: data.rate,
          averageRate: data.averageRate ?? data.rate,
          dollarRate: data.dollarRate ?? null,
          euroRate: data.euroRate ?? null,
          source:
            data.source ??
            "Promedio entre dólar oficial BCV y euro oficial BCV",
          updatedAt: data.updatedAt ?? null,
          dollarUpdatedAt: data.dollarUpdatedAt ?? null,
          euroUpdatedAt: data.euroUpdatedAt ?? null,
          loading: false,
          error: null,
        }

        setExchange(nextExchange)
        localStorage.setItem(EXCHANGE_STORAGE_KEY, JSON.stringify(nextExchange))
      } catch (error) {
        setExchange((current) => ({
          ...current,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Error actualizando la tasa.",
        }))
      }
    }

    loadExchangeRate()

    const interval = window.setInterval(loadExchangeRate, REFRESH_TIME)
    window.addEventListener("focus", loadExchangeRate)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", loadExchangeRate)
    }
  }, [])

  return exchange
}