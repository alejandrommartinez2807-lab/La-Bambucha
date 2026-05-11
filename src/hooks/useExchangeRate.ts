"use client"

import { useEffect, useState } from "react"
import { siteConfig } from "@/config/site"

const CACHE_KEY = "burger_club_exchange_rate_v2"
const CACHE_TIME = 6 * 60 * 60 * 1000

type ExchangeSource = "BCV" | "Cache" | "Fallback"

type ExchangeCache = {
  rate: number
  source: ExchangeSource
  updatedAt: string | null
  timestamp: number
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
          const parsed: ExchangeCache = JSON.parse(cached)
          const isFresh = Date.now() - parsed.timestamp < CACHE_TIME

          if (isFresh && Number(parsed.rate) > 0) {
            setRate(Number(parsed.rate))
            setSource("Cache")
            setUpdatedAt(parsed.updatedAt || null)
            setLoading(false)
            return
          }
        }

        const response = await fetch("/api/exchange-rate", {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("No se pudo cargar la tasa")
        }

        const data = await response.json()
        const newRate = Number(data.rate)

        if (!newRate) {
          throw new Error("Tasa inválida")
        }

        setRate(newRate)
        setSource("BCV")
        setUpdatedAt(data.updatedAt || null)

        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            rate: newRate,
            source: "BCV",
            updatedAt: data.updatedAt || null,
            timestamp: Date.now(),
          })
        )
      } catch {
        setRate(siteConfig.currency.fallbackRate)
        setSource("Fallback")
        setUpdatedAt(null)
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