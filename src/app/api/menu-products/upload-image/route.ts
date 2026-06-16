import { NextRequest, NextResponse } from "next/server"
import { uploadMenuProductImageInAppsScript } from "@/lib/appsScriptOrders"
import { getLocalAccessFromPassword, type LocalRole } from "@/lib/localAccess"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getRequestPassword(request: NextRequest) {
  return (
    request.headers.get("x-local-password") ||
    request.headers.get("x-admin-password") ||
    ""
  )
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 })
}

function forbiddenResponse(message = "Esta clave no tiene permiso para subir imágenes del menú") {
  return NextResponse.json({ error: message }, { status: 403 })
}

function checkRole(request: NextRequest, allowedRoles: LocalRole[]) {
  const access = getLocalAccessFromPassword(getRequestPassword(request))

  if (!access.ok) {
    return {
      ok: false as const,
      response: unauthorizedResponse(),
    }
  }

  if (!allowedRoles.includes(access.role)) {
    return {
      ok: false as const,
      response: forbiddenResponse(),
    }
  }

  return {
    ok: true as const,
    response: null,
  }
}

function normalizePayload(value: unknown) {
  const source = (value || {}) as {
    dataUrl?: unknown
    fileName?: unknown
    mimeType?: unknown
    productName?: unknown
  }

  return {
    dataUrl: String(source.dataUrl || "").trim(),
    fileName: String(source.fileName || "producto-menu.jpg").trim(),
    mimeType: String(source.mimeType || "image/jpeg").trim(),
    productName: String(source.productName || "producto-menu").trim(),
  }
}

export async function POST(request: NextRequest) {
  try {
    const roleCheck = checkRole(request, ["owner", "manager"])

    if (!roleCheck.ok) {
      return roleCheck.response
    }

    const body = await request.json()
    const input = normalizePayload(body)

    if (!input.dataUrl || !input.dataUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Selecciona una imagen válida para subir." },
        { status: 400 }
      )
    }

    if (input.dataUrl.length > 4_800_000) {
      return NextResponse.json(
        {
          error:
            "La imagen sigue siendo muy pesada. Recorta o reduce la foto y vuelve a subirla.",
        },
        { status: 413 }
      )
    }

    const image = await uploadMenuProductImageInAppsScript(input)

    return NextResponse.json({
      ok: true,
      image,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo subir la imagen del producto",
      },
      { status: 500 }
    )
  }
}
