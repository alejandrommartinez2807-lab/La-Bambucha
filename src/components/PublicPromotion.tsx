"use client"

import { useEffect, useMemo, useState } from "react"
import { Sparkles } from "lucide-react"

type PublicPromotionConfig = {
  promotionActive?: boolean
  promotionTitle?: string
  promotionText?: string
  promotionHighlight?: string
  promotionButtonText?: string
  promotionButtonHref?: string
  promotionProductId?: number
  promotionProductName?: string
  promotionPriceUSD?: number
  promotionImage?: string
}

function normalizeText(value: unknown) {
  return String(value || "")
    .replace(/Santo Perrito/gi, "La Bambucha")
    .replace(/perritos, salchipapas, raciones y bebidas frías/gi, "hamburguesas, perritos, pepitos, shawarmas, parrillas, combos y bebidas")
    .trim()
}

function normalizeHref(value: unknown) {
  const cleanValue = normalizeText(value)

  if (!cleanValue) return "#menu"

  if (
    cleanValue.startsWith("#") ||
    cleanValue.startsWith("/") ||
    cleanValue.startsWith("http://") ||
    cleanValue.startsWith("https://")
  ) {
    return cleanValue
  }

  return "#menu"
}

function normalizeNumber(value: unknown) {
  const numberValue = Number(value || 0)

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return 0
  }

  return Math.round((numberValue + Number.EPSILON) * 100) / 100
}

function formatPromoPrice(value: number) {
  return `$${value.toFixed(2)}`
}

async function getPublicPromotionConfig() {
  const response = await fetch("/api/public/business-config", {
    method: "GET",
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("No se pudo cargar la promoción pública")
  }

  const data = await response.json()
  const source = (data.businessConfig ||
    data.config ||
    data.publicConfig ||
    data ||
    {}) as Record<string, unknown>

  return {
    promotionActive: Boolean(source.promotionActive),
    promotionTitle: normalizeText(source.promotionTitle),
    promotionText: normalizeText(source.promotionText),
    promotionHighlight: normalizeText(source.promotionHighlight),
    promotionButtonText: normalizeText(source.promotionButtonText),
    promotionButtonHref: normalizeHref(source.promotionButtonHref),
    promotionProductId: Math.round(normalizeNumber(source.promotionProductId)),
    promotionProductName: normalizeText(source.promotionProductName),
    promotionPriceUSD: normalizeNumber(source.promotionPriceUSD),
    promotionImage: normalizeText(source.promotionImage),
  } satisfies PublicPromotionConfig
}

export default function PublicPromotion() {
  const [promotionConfig, setPromotionConfig] =
    useState<PublicPromotionConfig | null>(null)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    let isMounted = true

    getPublicPromotionConfig()
      .then((config) => {
        if (isMounted) setPromotionConfig(config)
      })
      .catch(() => {
        if (isMounted) setPromotionConfig(null)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    setImageFailed(false)
  }, [promotionConfig?.promotionImage])

  const canShowPromotion = useMemo(() => {
    if (!promotionConfig?.promotionActive) return false

    return Boolean(
      promotionConfig.promotionTitle ||
        promotionConfig.promotionText ||
        promotionConfig.promotionHighlight ||
        promotionConfig.promotionProductName ||
        promotionConfig.promotionImage ||
        (promotionConfig.promotionPriceUSD || 0) > 0
    )
  }, [promotionConfig])

  if (!canShowPromotion || !promotionConfig) {
    return null
  }

  const title =
    promotionConfig.promotionTitle ||
    promotionConfig.promotionProductName ||
    "Promoción especial"
  const productName = promotionConfig.promotionProductName || ""
  const text =
    promotionConfig.promotionText ||
    "Aprovecha una promoción preparada para disfrutar al estilo Bambucha."
  const highlight =
    promotionConfig.promotionHighlight || "Disponible por tiempo limitado."
  const buttonText = promotionConfig.promotionButtonText || "Ver menú"
  const buttonHref = promotionConfig.promotionButtonHref || "#menu"
  const imageUrl = promotionConfig.promotionImage || ""
  const promotionPriceUSD = promotionConfig.promotionPriceUSD || 0

  return (
    <section className="relative overflow-hidden bg-[#d8a116] px-4 py-12 text-[#210a00] sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,243,166,0.36),transparent_32%),linear-gradient(180deg,#d8a116_0%,#f4c526_52%,#c97c00_100%)]" />

      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-yellow-300/18 bg-[#4a1f00]/96 shadow-2xl shadow-[#6b2a00]/25">
        <div className="grid gap-7 p-6 sm:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch lg:p-10">
          <div className="flex flex-col justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] bg-yellow-300 text-[#4a1f00] shadow-[0_7px_0_rgba(0,0,0,0.18)]">
                <Sparkles size={38} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-yellow-300">
                  Promoción activa
                </p>
                <h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-[-0.05em] text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.25)] sm:text-5xl">
                  {title}
                </h2>
                {productName && productName !== title && (
                  <p className="mt-3 text-sm font-black uppercase tracking-[0.14em] text-yellow-100/75">
                    Producto: {productName}
                  </p>
                )}
              </div>
            </div>

            {imageUrl && !imageFailed && (
              <div className="overflow-hidden rounded-[1.6rem] border border-yellow-300/20 bg-[#120800]">
                <img
                  src={imageUrl}
                  alt={title}
                  onError={() => setImageFailed(true)}
                  className="h-[240px] w-full object-cover object-center sm:h-[320px] lg:h-[360px]"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between rounded-[1.5rem] border border-yellow-300/18 bg-[#2c0d00]/55 p-5">
            <div>
              <div className="inline-flex rounded-full bg-yellow-300 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#4a1f00]">
                Oferta destacada
              </div>

              <p className="mt-5 text-2xl font-black leading-8 text-yellow-100">
                {highlight}
              </p>
              <p className="mt-3 text-sm font-bold leading-7 text-yellow-50/78">
                {text}
              </p>

              {promotionPriceUSD > 0 && (
                <div className="mt-5 rounded-[1.3rem] border border-yellow-300/18 bg-yellow-300 p-4 text-[#3a1600]">
                  <p className="text-xs font-black uppercase tracking-[0.18em]">
                    Precio promocional
                  </p>
                  <p className="mt-1 text-4xl font-black">
                    {formatPromoPrice(promotionPriceUSD)}
                  </p>
                </div>
              )}
            </div>

            <a
              href={buttonHref}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-red-700 via-orange-500 to-yellow-300 px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-black transition hover:scale-[1.01]"
            >
              {buttonText}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
