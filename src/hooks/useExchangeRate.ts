"use client"

import { useEffect, useState } from "react"
import { siteConfig } from "@/config/site"

const CACHE_KEY = "bcv_exchange_rate"
const ONE_DAY = 24 * 60 * 60 * 1000

type ExchangeSource = "BCV" | "Cache" | "Fallback"

type DolarApiResponse = {
  promedio?: number | string
  promedioGeneral?: number | string
  venta?: number | string
  compra?: number | string
  fechaActualizacion?: string
}

function parseRate(value: unknown) {
  if (typeof value === "number") return value

  if (typeof value === "string") {
    const normalized = value.replace(",", ".")
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

export function useExchangeRate() {
  const [rate, setRate] = useState(siteConfig.currency.fallbackRate)
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<ExchangeSource>("Fallback")
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    async function loadRate() {
      try {
        const cached = localStorage.getItem(CACHE_KEY)

        if (cached) {
          const parsed = JSON.parse(cached)
          const isFresh = Date.now() - parsed.timestamp < ONE_DAY
          const cachedRate = parseRate(parsed.rate)

          if (isFresh && cachedRate > 0) {
            setRate(cachedRate)
            setUpdatedAt(parsed.updatedAt || null)
            setSource("Cache")
            setLoading(false)
            return
          }
        }

        const response = await fetch(
          "https://ve.dolarapi.com/v1/dolares/oficial"
        )

        if (!response.ok) {
          throw new Error("No se pudo obtener la tasa")
        }

        const data: DolarApiResponse = await response.json()

        const newRate =
          parseRate(data.promedio) ||
          parseRate(data.promedioGeneral) ||
          parseRate(data.venta) ||
          parseRate(data.compra) ||
          siteConfig.currency.fallbackRate

        setRate(newRate)
        setUpdatedAt(data.fechaActualizacion || null)
        setSource("BCV")

        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            rate: newRate,
            updatedAt: data.fechaActualizacion || null,
            timestamp: Date.now(),
          })
        )
      } catch {
        setRate(siteConfig.currency.fallbackRate)
        setSource("Fallback")
      } finally {
        setLoading(false)
      }
    }

    loadRate()
  }, [])

  return {
    rate,
    loading,
    source,
    updatedAt,
  }
}