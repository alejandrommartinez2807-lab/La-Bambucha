import { NextResponse } from "next/server"
import {
  DEFAULT_PUBLIC_BUSINESS_CONFIG,
  normalizePublicBusinessConfig,
} from "@/types/publicBusinessConfig"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
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
