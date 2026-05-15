"use client"

import { useMemo, useState } from "react"
import ProductCard from "./ProductCard"
import { categories, products } from "@/data/products"
import type { ProductToAdd } from "@/hooks/useCart"

type ProductsProps = {
  onAddToCart: (product: ProductToAdd) => void
  exchangeRate: number
}

const sampleProductIds = [27, 28, 15]

export default function Products({ onAddToCart, exchangeRate }: ProductsProps) {
  const [selectedCategory, setSelectedCategory] = useState("Todos")

  const allCategories = useMemo(() => ["Todos", ...categories], [])

  const sampleProducts = useMemo(() => {
    return sampleProductIds
      .map((id) => products.find((product) => product.id === id))
      .filter((product): product is (typeof products)[number] =>
        Boolean(product)
      )
  }, [])

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "Todos") return products

    return products.filter((product) => product.category === selectedCategory)
  }, [selectedCategory])

  return (
    <section
      id="menu"
      className="relative overflow-hidden bg-[#050101] px-4 py-14 text-white sm:py-20"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,122,0,0.18),transparent_35%),linear-gradient(180deg,#050101_0%,#160505_45%,#050101_100%)]" />
      <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-red-700/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-8 text-center sm:mb-12">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-orange-400 sm:text-sm">
            La Bambucha Grill Burger
          </p>

          <h2 className="text-4xl font-black uppercase text-red-600 drop-shadow-[0_0_18px_rgba(255,0,0,0.55)] sm:text-5xl md:text-7xl">
            Menú
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold text-zinc-300 sm:text-base md:text-lg">
            Combos, hamburguesas, perritos, pepitos, shawarmas, parrillas,
            delicias y bebidas.
          </p>
        </div>

        <div className="mb-12 rounded-3xl border border-orange-500/25 bg-black/35 p-4 shadow-[0_0_45px_rgba(255,90,0,0.12)] sm:p-6">
          <div className="mb-6 text-center">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-400">
              Fotos reales
            </p>

            <h3 className="mt-2 text-3xl font-black uppercase text-yellow-400 sm:text-4xl">
              Muestras
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-zinc-400">
              Algunos productos destacados para que veas el estilo Bambucha.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sampleProducts.map((product) => (
              <ProductCard
                key={`sample-${product.id}`}
                product={product}
                onAddToCart={onAddToCart}
                exchangeRate={exchangeRate}
              />
            ))}
          </div>
        </div>

        <div className="-mx-4 mb-8 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mb-10 sm:overflow-visible sm:px-0">
          <div className="flex min-w-max gap-2 sm:min-w-0 sm:flex-wrap sm:justify-center sm:gap-3">
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full border px-4 py-2.5 text-xs font-black uppercase transition sm:px-5 sm:py-3 sm:text-sm ${
                  selectedCategory === category
                    ? "border-yellow-400 bg-gradient-to-r from-red-700 via-orange-500 to-yellow-400 text-black shadow-[0_0_22px_rgba(255,90,0,0.35)]"
                    : "border-orange-500/30 bg-black/60 text-orange-300 hover:border-orange-400 hover:text-yellow-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <p className="mb-5 text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 sm:hidden">
          {filteredProducts.length} productos
        </p>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              exchangeRate={exchangeRate}
            />
          ))}
        </div>
      </div>
    </section>
  )
}