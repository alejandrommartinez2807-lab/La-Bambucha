"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
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
    <section
      id="menu"
      className="bg-[#050505] px-4 py-16 text-white sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.55 }}
          className="mb-10 max-w-3xl sm:mb-14"
        >
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.35em] text-yellow-400 sm:text-sm">
            Menú Burger Club
          </p>

          <h2 className="text-4xl font-black uppercase leading-[0.92] tracking-[-0.05em] sm:text-6xl">
            Elige tu próximo{" "}
            <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
              antojo
            </span>
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Precios en dólares y bolívares actualizados. Agrega productos al
            carrito y manda tu pedido directo por WhatsApp.
          </p>
        </motion.div>

        <div className="mb-10 flex gap-3 overflow-x-auto pb-3">
          {categories.map((category) => {
            const isActive = selectedCategory === category

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`shrink-0 rounded-full border px-5 py-3 text-sm font-black uppercase transition ${
                  isActive
                    ? "border-yellow-400 bg-yellow-400 text-black shadow-lg shadow-yellow-950/30"
                    : "border-white/10 bg-zinc-950 text-zinc-300 hover:border-yellow-400 hover:text-yellow-400"
                }`}
              >
                {category}
              </button>
            )
          })}
        </div>

        <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                category={product.category}
                description={product.description}
                price={product.price}
                image={product.image}
                exchangeRate={exchangeRate}
                onAddToCart={onAddToCart}
                index={index}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}