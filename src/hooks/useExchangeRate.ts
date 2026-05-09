"use client"

import { useEffect, useState } from "react"
import { siteConfig } from "@/config/site"

const CACHE_KEY = "bcv_exchange_rate"
const ONE_DAY = 24 * 60 * 60 * 1000

export function useExchangeRate() {
  const [rate, setRate] = useState(siteConfig.currency.fallbackRate)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRate() {
      try {
        const cached = localStorage.getItem(CACHE_KEY)

        if (cached) {
          const parsed = JSON.parse(cached)
          const isFresh = Date.now() - parsed.timestamp < ONE_DAY

          if (isFresh && parsed.rate) {
            setRate(parsed.rate)
            setLoading(false)
            return
          }
        }

        const response = await fetch(
          "https://ve.dolarapi.com/v1/dolares/oficial"
        )

        const data = await response.json()
        console.log("DATA API:", data)
        const newRate =
            data.promedio ||
            data.promedioGeneral ||
            data.venta ||
            siteConfig.currency.fallbackRate
        console.log("TASA FINAL:", newRate)
        setRate(newRate)

        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            rate: newRate,
            timestamp: Date.now(),
          })
        )
      } catch {
        setRate(siteConfig.currency.fallbackRate)
      } finally {
        setLoading(false)
      }
    }

    loadRate()
  }, [])

  return {
    rate,
    loading,
  }
}