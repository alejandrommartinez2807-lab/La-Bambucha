"use client"

import { Plus, ShoppingCart } from "lucide-react"
import type { ProductToAdd } from "@/hooks/useCart"

type ProductCardProps = {
  product: ProductToAdd & {
    category: string
    description: string
    image: string
  }
  onAddToCart: (product: ProductToAdd) => void
  exchangeRate: number
}

export default function ProductCard({
  product,
  onAddToCart,
  exchangeRate,
}: ProductCardProps) {
  const bsPrice =
    exchangeRate && exchangeRate > 0
      ? (product.price * exchangeRate).toFixed(2)
      : null

  return (
    <article className="group flex overflow-hidden rounded-2xl border border-orange-500/25 bg-gradient-to-b from-[#1a0505] to-[#080101] shadow-[0_14px_35px_rgba(0,0,0,0.42)] transition duration-300 hover:border-orange-400/70 sm:block sm:rounded-3xl sm:hover:-translate-y-1 sm:hover:shadow-[0_24px_60px_rgba(255,80,0,0.18)]">
      <div className="relative h-auto w-32 shrink-0 overflow-hidden bg-black sm:h-56 sm:w-full">
        <img
          src={product.image || "/logo-bambucha.png"}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = "/logo-bambucha.png"
            event.currentTarget.className =
              "h-full w-full object-contain p-4 transition duration-500 group-hover:scale-110 sm:p-8"
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

        <span className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-red-700 to-orange-500 px-2 py-1 text-[10px] font-black uppercase text-white shadow-[0_0_16px_rgba(255,80,0,0.45)] sm:left-4 sm:top-4 sm:px-3 sm:text-xs">
          {product.category}
        </span>
      </div>

      <div className="flex min-h-[160px] flex-1 flex-col justify-between p-4 sm:min-h-[250px] sm:p-5">
        <div>
          <h3 className="line-clamp-2 text-base font-black uppercase text-white sm:text-xl">
            {product.name}
          </h3>

          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-300 sm:mt-3 sm:text-sm">
            {product.description}
          </p>
        </div>

        <div className="mt-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-400 sm:text-xs">
                Precio
              </p>

              <span className="text-xl font-black text-yellow-400 sm:text-2xl">
                Ref. {product.price}
              </span>

              {bsPrice && (
                <p className="mt-0.5 hidden text-xs font-bold text-zinc-400 sm:block">
                  Aprox. Bs. {bsPrice}
                </p>
              )}
            </div>

            <button
              onClick={() => onAddToCart(product)}
              className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-red-700 via-orange-500 to-yellow-400 px-4 py-2.5 text-xs font-black uppercase text-black shadow-[0_0_20px_rgba(255,90,0,0.35)] transition hover:scale-105 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm"
            >
              <Plus size={16} />
              Agregar
            </button>
          </div>

          <a
            href={`https://wa.me/584244721722?text=Hola,%20quiero%20pedir%20${encodeURIComponent(
              product.name
            )}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 hidden w-full items-center justify-center gap-2 rounded-full border border-orange-500/35 bg-black/50 px-4 py-3 text-sm font-black uppercase text-orange-300 transition hover:border-yellow-400 hover:text-yellow-300 sm:flex"
          >
            <ShoppingCart size={17} />
            Pedir por WhatsApp
          </a>
        </div>
      </div>
    </article>
  )
}