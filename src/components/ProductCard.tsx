"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Plus, ShoppingCart } from "lucide-react"
import { formatUSD, formatVES } from "@/utils/formatCurrency"

type ProductCardProps = {
  id: number
  name: string
  category?: string
  description: string
  price: number
  image: string
  exchangeRate: number
  index?: number
  onAddToCart: (product: {
    id: number
    name: string
    price: number
    image: string
  }) => void
}

export default function ProductCard({
  id,
  name,
  category,
  description,
  price,
  image,
  exchangeRate,
  index = 0,
  onAddToCart,
}: ProductCardProps) {
  const [added, setAdded] = useState(false)

  const isFirulais = name.toLowerCase().includes("firulais")

  function handleAddToCart() {
    onAddToCart({
      id,
      name,
      price,
      image,
    })

    setAdded(true)

    setTimeout(() => {
      setAdded(false)
    }, 900)
  }

  return (
    <motion.article
      id={isFirulais ? "producto-firulais" : undefined}
      layout
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2) }}
      whileHover={{ y: -8 }}
      className={`scroll-mt-28 overflow-hidden rounded-[1.8rem] border bg-zinc-950 shadow-2xl shadow-black/40 ${
        isFirulais
          ? "border-yellow-400/60 ring-2 ring-yellow-400/20"
          : "border-white/10"
      }`}
    >
      <div className="relative h-64 overflow-hidden bg-zinc-900 sm:h-72">
        <motion.img
          src={image}
          alt={name}
          className="h-full w-full object-cover"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.45 }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

        {isFirulais && (
          <span className="absolute right-4 top-4 rounded-full bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-black shadow-lg shadow-yellow-950/30">
            Recomendado
          </span>
        )}

        {category && (
          <span className="absolute left-4 top-4 rounded-full border border-yellow-400/30 bg-black/70 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-yellow-400 backdrop-blur">
            {category}
          </span>
        )}

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-400">
              Burger Club
            </p>

            <h3 className="mt-1 text-2xl font-black uppercase leading-none tracking-[-0.04em] text-white">
              {name}
            </h3>
          </div>

          <div className="rounded-2xl bg-yellow-400 px-4 py-3 text-right text-black shadow-xl shadow-yellow-950/30">
            <span className="block text-lg font-black leading-none">
              {formatUSD(price)}
            </span>

            <span className="text-xs font-bold">
              Bs {formatVES(price * exchangeRate)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <p className="min-h-[56px] text-sm leading-relaxed text-zinc-400 sm:text-base">
          {description}
        </p>

        <button
          type="button"
          onClick={handleAddToCart}
          className={`mt-6 flex w-full items-center justify-center gap-3 rounded-xl px-4 py-4 font-black uppercase transition active:scale-[0.98] ${
            added
              ? "bg-green-500 text-white"
              : "bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-500 hover:to-yellow-500"
          }`}
        >
          {added ? (
            <>
              <ShoppingCart size={18} />
              Agregado
            </>
          ) : (
            <>
              <Plus size={18} />
              Agregar al carrito
            </>
          )}
        </button>
      </div>
    </motion.article>
  )
}