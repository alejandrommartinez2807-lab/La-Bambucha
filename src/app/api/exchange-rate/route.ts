import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const DOLAR_OFICIAL_URL = "https://ve.dolarapi.com/v1/dolares/oficial"

// La tasa del BCV cambia una vez al día, así que se cachea 30 min en el CDN.
// El stale-while-revalidate de 24 h es lo importante: si DolarApi falla, el
// CDN sigue entregando la última tasa buena mientras reintenta por detrás,
// en vez de dejar la carta sin tasa (que es lo que mostraba "Bs 0,00").
const CACHE_SECONDS = 1800
const STALE_SECONDS = 86400

const CACHEABLE_HEADERS = {
  "Cache-Control": `public, max-age=0, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`,
  "CDN-Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`,
  "Vercel-CDN-Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`,
}

// Un fallo nunca se cachea: el siguiente request vuelve a intentarlo.
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
}

type ApiRateResponse = {
  fuente?: string
  nombre?: string
  moneda?: string
  compra?: number | string
  venta?: number | string
  promedio?: number | string
  fechaActualizacion?: string
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.replace(",", ".").replace(/[^\d.-]/g, "")
    const parsed = Number(normalized)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

async function fetchDollarRate(): Promise<ApiRateResponse> {
  const response = await fetch(DOLAR_OFICIAL_URL, {
    method: "GET",
    next: {
      revalidate: CACHE_SECONDS,
    },
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Error consultando dólar oficial BCV: ${response.status}`)
  }

  return response.json()
}

export async function GET() {
  try {
    const dollarData = await fetchDollarRate()
    const dollarRate = toNumber(dollarData.promedio)

    if (!dollarRate || dollarRate <= 0) {
      throw new Error("No se pudo leer la tasa del dólar oficial BCV.")
    }

    const bcvRate = Number(dollarRate.toFixed(2))
    const valueDate = dollarData.fechaActualizacion || null

    return NextResponse.json(
      {
        rate: bcvRate,
        bcvRate,
        dollarRate: bcvRate,
        averageRate: bcvRate,
        euroRate: null,
        formula: "dollarRate",
        currency: "VES",
        name: "Dólar oficial BCV",
        source: "Dólar oficial BCV",
        valueDate,
        dollarUpdatedAt: valueDate,
        euroUpdatedAt: null,
        updatedAt: new Date().toISOString(),
        fallback: false,
        warning: null,
      },
      {
        headers: CACHEABLE_HEADERS,
      }
    )
  } catch (error) {
    return NextResponse.json(
      {
        rate: null,
        bcvRate: null,
        averageRate: null,
        dollarRate: null,
        euroRate: null,
        currency: "VES",
        name: "Dólar oficial BCV",
        source: "Dólar oficial BCV",
        valueDate: null,
        dollarUpdatedAt: null,
        euroUpdatedAt: null,
        updatedAt: new Date().toISOString(),
        fallback: true,
        warning:
          "No se pudo consultar la tasa BCV. Revisa la conexión o intenta actualizar más tarde.",
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido consultando la tasa BCV.",
      },
      {
        status: 500,
        headers: NO_STORE_HEADERS,
      }
    )
  }
}
