"use client"

import { useEffect, useRef } from "react"

/**
 * Sondeo periódico que se detiene mientras la pestaña no está visible.
 *
 * Los paneles del local (caja, cocina, delivery, pedidos) quedan abiertos
 * durante horas. Con un setInterval pelado siguen consultando la API con la
 * pantalla apagada, el equipo bloqueado o la pestaña en segundo plano: ese
 * sondeo invisible era el grueso de las invocaciones de función en Vercel.
 *
 * Al volver a primer plano se refresca de inmediato, así que el operador nunca
 * ve datos viejos por haber pausado. El intervalo no cambia: durante el
 * servicio se comporta igual que antes.
 */
export function useVisiblePolling(
  callback: () => void,
  intervalMs: number,
  enabled = true
) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    let interval: number | null = null

    const stop = () => {
      if (interval !== null) {
        window.clearInterval(interval)
        interval = null
      }
    }

    const start = () => {
      if (interval === null) {
        interval = window.setInterval(() => savedCallback.current(), intervalMs)
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop()
        return
      }

      // De vuelta en primer plano: refresca ya y reanuda el sondeo.
      savedCallback.current()
      start()
    }

    if (!document.hidden) {
      start()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      stop()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [intervalMs, enabled])
}
