"use client"

import { useEffect, useRef } from "react"

/**
 * Sondeo periódico que se frena mientras la pestaña no está visible.
 *
 * Los paneles del local (cocina, caja, delivery, pedidos) quedan abiertos
 * durante horas. Con un setInterval pelado siguen consultando la API con la
 * pantalla apagada, el equipo bloqueado o la pestaña en segundo plano: ese
 * sondeo invisible era el grueso de las invocaciones de función en Vercel.
 *
 * Al volver a primer plano se refresca de inmediato, así que el operador nunca
 * ve datos viejos por haber pausado.
 *
 * `hiddenIntervalMs` es para los paneles que avisan con sonido (caja, cocina y
 * pedidos): ahí el sondeo NO se detiene en segundo plano, sigue corriendo pero
 * mucho más espaciado, para que un pedido nuevo se escuche igual aunque la
 * pestaña esté detrás. Sin ese parámetro el sondeo se detiene del todo, que es
 * lo correcto para los paneles sin sonido (delivery).
 */
export function useVisiblePolling(
  callback: () => void,
  intervalMs: number,
  enabled = true,
  hiddenIntervalMs?: number
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

    // Reemplaza el intervalo vigente para no acumular dos a la vez.
    const run = (everyMs: number) => {
      stop()
      interval = window.setInterval(() => savedCallback.current(), everyMs)
    }

    const sync = () => {
      if (document.hidden) {
        if (hiddenIntervalMs) run(hiddenIntervalMs)
        else stop()
        return
      }

      run(intervalMs)
    }

    const handleVisibilityChange = () => {
      // De vuelta en primer plano: refresca ya y retoma el ritmo normal.
      if (!document.hidden) savedCallback.current()
      sync()
    }

    sync()

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      stop()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [intervalMs, enabled, hiddenIntervalMs])
}
