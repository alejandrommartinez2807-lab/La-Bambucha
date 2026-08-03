import { NextResponse } from "next/server"
import {
  DEFAULT_PUBLIC_BUSINESS_CONFIG,
  normalizePublicBusinessConfig,
} from "@/types/publicBusinessConfig"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Igual que el menú: la configuración viene de Apps Script y tardaba hasta 12
// segundos en cada visita. Se cachea solo la configuración real; los dos
// caminos de respaldo siguen sin cachearse para no dejar el sitio pegado con
// la configuración base.
const CACHE_SECONDS = 60
const STALE_SECONDS = 3600

const CACHEABLE_HEADERS = {
  "Cache-Control": `public, max-age=0, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`,
  "CDN-Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`,
  "Vercel-CDN-Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`,
}

function canUseRemoteBusinessConfig() {
  return Boolean(process.env.GOOGLE_SHEETS_WEB_APP_URL)
}

export async function GET() {
  if (!canUseRemoteBusinessConfig()) {
    return NextResponse.json(
      {
        ok: true,
        businessConfig: DEFAULT_PUBLIC_BUSINESS_CONFIG,
        fallback: true,
        warning:
          "No hay GOOGLE_SHEETS_WEB_APP_URL configurado. Se está usando la configuración base de La Bambucha.",
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    )
  }

  try {
    const { getBusinessConfigFromAppsScript } = await import(
      "@/lib/appsScriptOrders"
    )
    const remoteBusinessConfig = await getBusinessConfigFromAppsScript()
    const businessConfig = normalizePublicBusinessConfig(remoteBusinessConfig)

    return NextResponse.json(
      {
        ok: true,
        businessConfig,
        fallback: false,
      },
      {
        headers: CACHEABLE_HEADERS,
      }
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: true,
        businessConfig: DEFAULT_PUBLIC_BUSINESS_CONFIG,
        fallback: true,
        warning:
          error instanceof Error
            ? `No se pudo cargar la configuración remota. Se está usando la configuración base de La Bambucha. Detalle: ${error.message}`
            : "No se pudo cargar la configuración remota. Se está usando la configuración base de La Bambucha.",
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    )
  }
}
