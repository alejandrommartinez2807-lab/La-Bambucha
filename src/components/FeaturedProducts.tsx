"use client"

import { useMemo } from "react"
import { Sparkles } from "lucide-react"
import ProductCard from "@/components/ProductCard"
import { products as fallbackProducts, type Product } from "@/data/products"
import type { ProductToAdd } from "@/hooks/useCart"
import type { PublicBusinessConfig } from "@/types/publicBusinessConfig"

type FeaturedProductsProps = {
  exchangeRate: number
  onAddToCart: (product: ProductToAdd) => void
  products?: Product[]
  businessConfig: PublicBusinessConfig
}

function normalizeProductIds(value: unknown) {
  if (!Array.isArray(value)) return []

  const seen = new Set<number>()

  return value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0)
    .map((item) => Math.round(item))
    .filter((item) => {
      if (seen.has(item)) return false
      seen.add(item)
      return true
    })
}

export default function FeaturedProducts({
  exchangeRate,
  onAddToCart,
  products = fallbackProducts,
  businessConfig,
}: FeaturedProductsProps) {
  const publicProducts = products.length ? products : fallbackProducts

  const featuredProducts = useMemo(() => {
    const ids = normalizeProductIds(businessConfig.featuredProductIds)
    const byId = ids
      .map((id) => publicProducts.find((product) => product.id === id))
      .filter((product): product is Product => Boolean(product))

    const byFlag = publicProducts.filter((product) => product.isFeatured === true)
    const merged = [...byId, ...byFlag]
    const seen = new Set<number>()

    return merged
      .filter((product) => product.isActive !== false)
      .filter((product) => {
        if (seen.has(product.id)) return false
        seen.add(product.id)
        return true
      })
      .slice(0, 6)
  }, [businessConfig.featuredProductIds, publicProducts])

  if (
    businessConfig.featuredProductsModuleEnabled === false ||
    !businessConfig.featuredProductsActive ||
    featuredProducts.length === 0
  ) {
    return null
  }

  const title = businessConfig.featuredProductsTitle || "Favoritos de La Bambucha"
  const text =
    businessConfig.featuredProductsText ||
    "Una selección rápida con favoritos de La Bambucha para armar tu antojo."

  return (
    <section className="relative overflow-hidden bg-[#d8a116] px-4 py-14 text-[#210a00] sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,243,166,0.48),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,57,0,0.24),transparent_34%),linear-gradient(180deg,#e3a915_0%,#ffd42a_100%)]" />

      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[#5c1c00]/20 bg-[#4a1f00]/95 shadow-2xl shadow-[#6b2a00]/25">
        <div className="relative overflow-hidden p-5 sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-yellow-300/20 blur-3xl" />

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#4a1f00]">
                <Sparkles size={16} />
                Recomendados
              </div>

              <h2 className="mt-4 max-w-4xl text-4xl font-black uppercase leading-none text-white drop-shadow-[0_5px_0_rgba(0,0,0,0.25)] sm:text-5xl lg:text-6xl">
                {title}
              </h2>

              <p className="mt-4 max-w-2xl text-sm font-bold leading-6 text-yellow-50/82 sm:text-base">
                {text}
              </p>
            </div>

            <a
              href="#menu"
              className="inline-flex w-fit items-center justify-center rounded-full border border-yellow-200/25 bg-yellow-300 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#4a1f00] shadow-[0_6px_0_rgba(0,0,0,0.16)] transition hover:bg-yellow-200"
            >
              Ver menú completo
            </a>
          </div>

          <div className="relative mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {featuredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                {...product}
                exchangeRate={exchangeRate}
                index={index}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
