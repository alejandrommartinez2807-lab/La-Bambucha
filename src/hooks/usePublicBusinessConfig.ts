"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  DEFAULT_PUBLIC_BUSINESS_CONFIG,
  normalizePublicBusinessConfig,
  type PublicBusinessConfig,
} from "@/types/publicBusinessConfig"

type PublicBusinessConfigState = {
  config: PublicBusinessConfig
  isLoading: boolean
  error: string | null
  warning: string | null
  fallback: boolean
  reload: () => Promise<void>
}

type PublicBusinessConfigResponse = {
  ok?: boolean
  businessConfig?: unknown
  config?: unknown
  fallback?: boolean
  warning?: string
  error?: string
}

type LoadPublicBusinessConfigOptions = {
  force?: boolean
  silent?: boolean
}

const PUBLIC_CONFIG_RELOAD_GUARD_MS = 1500

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError"
}

export function usePublicBusinessConfig(): PublicBusinessConfigState {
  const [config, setConfig] = useState<PublicBusinessConfig>(
    DEFAULT_PUBLIC_BUSINESS_CONFIG
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [fallback, setFallback] = useState(true)

  const isMountedRef = useRef(false)
  const lastReloadAtRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const loadConfig = useCallback(
    async ({ force = false, silent = false }: LoadPublicBusinessConfigOptions = {}) => {
      const now = Date.now()

      if (!force && now - lastReloadAtRef.current < PUBLIC_CONFIG_RELOAD_GUARD_MS) {
        return
      }

      lastReloadAtRef.current = now
      abortControllerRef.current?.abort()

      const controller = new AbortController()
      abortControllerRef.current = controller

      if (!silent) {
        setIsLoading(true)
      }

      setError(null)

      try {
        const response = await fetch(`/api/public/business-config?t=${now}`, {
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          signal: controller.signal,
        })
        const data = (await response.json()) as PublicBusinessConfigResponse

        if (!response.ok || data.error) {
          throw new Error(
            data.error || "No se pudo cargar la configuración pública."
          )
        }

        if (!isMountedRef.current || abortControllerRef.current !== controller) {
          return
        }

        setConfig(
          normalizePublicBusinessConfig(data.businessConfig || data.config || {})
        )
        setWarning(data.warning || null)
        setFallback(Boolean(data.fallback))
      } catch (loadError) {
        if (isAbortError(loadError)) {
          return
        }

        if (!isMountedRef.current || abortControllerRef.current !== controller) {
          return
        }

        setConfig(DEFAULT_PUBLIC_BUSINESS_CONFIG)
        setFallback(true)
        setWarning(null)
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar la configuración pública."
        )
      } finally {
        if (isMountedRef.current && abortControllerRef.current === controller) {
          setIsLoading(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    isMountedRef.current = true
    void loadConfig({ force: true })

    return () => {
      isMountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [loadConfig])

  useEffect(() => {
    function reloadWhenVisible() {
      if (document.visibilityState === "visible") {
        void loadConfig({ silent: true })
      }
    }

    function reloadWhenFocused() {
      void loadConfig({ silent: true })
    }

    function reloadWhenPageShows() {
      void loadConfig({ force: true, silent: true })
    }

    document.addEventListener("visibilitychange", reloadWhenVisible)
    window.addEventListener("focus", reloadWhenFocused)
    window.addEventListener("pageshow", reloadWhenPageShows)

    return () => {
      document.removeEventListener("visibilitychange", reloadWhenVisible)
      window.removeEventListener("focus", reloadWhenFocused)
      window.removeEventListener("pageshow", reloadWhenPageShows)
    }
  }, [loadConfig])

  return {
    config,
    isLoading,
    error,
    warning,
    fallback,
    reload: loadConfig,
  }
}
