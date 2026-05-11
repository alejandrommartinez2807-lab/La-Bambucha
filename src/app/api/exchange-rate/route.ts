import { NextResponse } from "next/server"

export async function GET() {
  try {
    const response = await fetch("https://ve.dolarapi.com/v1/dolares/oficial", {
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("No se pudo obtener la tasa oficial")
    }

    const data = await response.json()

    const rate =
      Number(data.promedio) ||
      Number(data.venta) ||
      Number(data.compra) ||
      0

    if (!rate) {
      throw new Error("Tasa inválida")
    }

    return NextResponse.json({
      rate,
      source: "BCV",
      updatedAt: data.fechaActualizacion || null,
    })
  } catch {
    return NextResponse.json(
      {
        rate: 0,
        source: "Error",
        updatedAt: null,
      },
      { status: 500 }
    )
  }
}