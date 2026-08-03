"use client"

import { useEffect, useState } from "react"

const EXCHANGE_STORAGE_KEY = "la_bambucha_premium_bcv_exchange_rate_v1"
const LEGACY_EXCHANGE_STORAGE_KEYS = [
  "la_bambucha_premium_average_exchange_rate_v1",
  "bambucha_average_exchange_rate",
]
const REFRESH_TIME = 30 * 60 * 1000 // 30 minutos

type ExchangeRateState = {
  rate: number
  bcvRate: number | null
  averageRate: number | null
  dollarRate: number | null
  euroRate: number | null
  currency?: string
  name?: string
  source: string
  valueDate: string | null
  updatedAt: string | null
  dollarUpdatedAt: string | null
  euroUpdatedAt: string | null
  fallback: boolean
  warning: string | null
  loading: boolean
  isLoading: boolean
  error: string | null
}

const initialState: ExchangeRateState = {
  rate: 0,
  bcvRate: null,
  averageRate: null,
  dollarRate: null,
  euroRate: null,
  currency: "VES",
  name: "Dólar oficial BCV",
  source: "Dólar oficial BCV",
  valueDate: null,
  updatedAt: null,
  dollarUpdatedAt: null,
  euroUpdatedAt: null,
  fallback: false,
  warning: null,
  loading: true,
  isLoading: true,
  error: null,
}

function isValidRate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
}

function normalizeSavedExchange(value: unknown): ExchangeRateState | null {
  const source = (value || {}) as Partial<ExchangeRateState>

  if (!isValidRate(source.rate)) {
    return null
  }

  const rate = source.rate

  return {
    ...initialState,
    ...source,
    rate,
    bcvRate: isValidRate(source.bcvRate) ? source.bcvRate : rate,
    averageRate: isValidRate(source.averageRate) ? source.averageRate : rate,
    dollarRate: isValidRate(source.dollarRate) ? source.dollarRate : rate,
    euroRate: isValidRate(source.euroRate) ? source.euroRate : null,
    currency: source.currency || "VES",
    name: source.name || "Dólar oficial BCV",
    source: source.source || "Dólar oficial BCV",
    loading: false,
    isLoading: false,
    error: null,
  }
}

function clearLegacyExchangeStorage() {
  LEGACY_EXCHANGE_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key)
  })
}

function readSavedExchange() {
  try {
    clearLegacyExchangeStorage()

    const saved = localStorage.getItem(EXCHANGE_STORAGE_KEY)

    if (!saved) {
      return null
    }

    return normalizeSavedExchange(JSON.parse(saved))
  } catch {
    localStorage.removeItem(EXCHANGE_STORAGE_KEY)
    return null
  }
}

export function useExchangeRate() {
  const [exchange, setExchange] = useState<ExchangeRateState>(initialState)

  useEffect(() => {
    const savedExchange = readSavedExchange()

    if (savedExchange) {
      setExchange(savedExchange)
    }

    async function loadExchangeRate() {
      try {
        setExchange((current) => ({
          ...current,
          loading: true,
          isLoading: true,
          error: null,
        }))

        // Sin cache-buster: la respuesta se sirve del CDN, que además guarda
        // la última tasa buena si el BCV falla.
        const response = await fetch("/api/exchange-rate", { method: "GET" })

        const data = await response.json()

        if (!response.ok || data.error) {
          throw new Error(data.error || "No se pudo actualizar la tasa BCV.")
        }

        if (!isValidRate(data.rate)) {
          throw new Error("La tasa BCV recibida no es válida.")
        }

        const rate = Number(data.rate)

        const nextExchange: ExchangeRateState = {
          rate,
          bcvRate: isValidRate(data.bcvRate) ? data.bcvRate : rate,
          averageRate: isValidRate(data.averageRate) ? data.averageRate : rate,
          dollarRate: isValidRate(data.dollarRate) ? data.dollarRate : rate,
          euroRate: isValidRate(data.euroRate) ? data.euroRate : null,
          currency: data.currency ?? "VES",
          name: data.name ?? "Dólar oficial BCV",
          source: data.source ?? "Dólar oficial BCV",
          valueDate: data.valueDate ?? null,
          updatedAt: data.updatedAt ?? null,
          dollarUpdatedAt: data.dollarUpdatedAt ?? data.valueDate ?? null,
          euroUpdatedAt: data.euroUpdatedAt ?? null,
          fallback: Boolean(data.fallback),
          warning: data.warning ?? null,
          loading: false,
          isLoading: false,
          error: null,
        }

        setExchange(nextExchange)
        localStorage.setItem(EXCHANGE_STORAGE_KEY, JSON.stringify(nextExchange))
        clearLegacyExchangeStorage()
      } catch (error) {
        setExchange((current) => ({
          ...current,
          loading: false,
          isLoading: false,
          fallback: true,
          warning:
            current.rate > 0
              ? "No se pudo actualizar la tasa BCV. Se mantiene la última tasa BCV guardada."
              : "No se pudo consultar la tasa BCV. Revisa la conexión e intenta de nuevo.",
          error:
            error instanceof Error
              ? error.message
              : "Error actualizando la tasa BCV.",
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
