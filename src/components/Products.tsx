"use client"

import { useState } from "react"

import ProductCard from "./ProductCard"
import { categories, products } from "@/data/products"
import type { ProductToAdd } from "@/hooks/useCart"

type ProductsProps = {
  onAddToCart: (product: ProductToAdd) => void
  exchangeRate: number
}

export default function Products({
  onAddToCart,
  exchangeRate,
}: ProductsProps) {
  const [selectedCategory, setSelectedCategory] = useState("Todos")

  const filteredProducts =
    selectedCategory === "Todos"
      ? products
      : products.filter((product) => product.category === selectedCategory)

  return (
    <section id="menu" className="bg-black px-4 py-16 text-white sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 sm:mb-14">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.35em] text-yellow-400 sm:text-sm">
            Nuestro menú
          </p>

          <h2 className="text-4xl font-black uppercase sm:text-5xl">
            Elige tu favorito
          </h2>
        </div>

        <div className="mb-10 flex gap-3 overflow-x-auto pb-3">
          {categories.map((category) => {
            const isActive = selectedCategory === category

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`shrink-0 rounded-full border px-5 py-3 text-sm font-black uppercase transition ${
                  isActive
                    ? "border-yellow-400 bg-yellow-400 text-black"
                    : "border-red-900/60 bg-zinc-950 text-zinc-300 hover:border-yellow-400 hover:text-yellow-400"
                }`}
              >
                {category}
              </button>
            )
          })}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              description={product.description}
              price={product.price}
              image={product.image}
              exchangeRate={exchangeRate}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </div>
    </section>
  )
}