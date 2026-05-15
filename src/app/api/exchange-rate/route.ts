import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

const DOLAR_OFICIAL_URL = "https://ve.dolarapi.com/v1/dolares/oficial"
const EURO_OFICIAL_URL = "https://ve.dolarapi.com/v1/euros/oficial"

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

async function fetchRate(url: string): Promise<ApiRateResponse> {
  const response = await fetch(url, {
    cache: "no-store",
    next: {
      revalidate: 0,
    },
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Error consultando tasa: ${response.status}`)
  }

  return response.json()
}

export async function GET() {
  try {
    const [dollarData, euroData] = await Promise.all([
      fetchRate(DOLAR_OFICIAL_URL),
      fetchRate(EURO_OFICIAL_URL),
    ])

    const dollarRate = toNumber(dollarData.promedio)
    const euroRate = toNumber(euroData.promedio)

    if (!dollarRate || !euroRate) {
      throw new Error("No se pudo leer la tasa del dólar o del euro.")
    }

    const averageRate = Number(((dollarRate + euroRate) / 2).toFixed(2))

    return NextResponse.json(
      {
        rate: averageRate,
        averageRate,
        dollarRate,
        euroRate,
        formula: "(dollarRate + euroRate) / 2",
        source: "Promedio entre dólar oficial BCV y euro oficial BCV",
        dollarUpdatedAt: dollarData.fechaActualizacion ?? null,
        euroUpdatedAt: euroData.fechaActualizacion ?? null,
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      {
        rate: null,
        averageRate: null,
        dollarRate: null,
        euroRate: null,
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido consultando la tasa.",
      },
      { status: 500 }
    )
  }
}