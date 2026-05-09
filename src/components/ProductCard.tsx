"use client"

import { formatUSD, formatVES } from "@/utils/formatCurrency"

type ProductCardProps = {
  id: number
  name: string
  description: string
  price: number
  image: string
  exchangeRate: number
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
  description,
  price,
  image,
  exchangeRate,
  onAddToCart,
}: ProductCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
      <img
        src={image}
        alt={name}
        className="h-56 w-full object-cover sm:h-72"
      />

      <div className="p-5 sm:p-6">
        <div className="mb-3 flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold text-white sm:text-2xl">
            {name}
          </h3>

          <div className="shrink-0 text-right">
            <span className="block text-base font-bold text-yellow-500 sm:text-lg">
              {formatUSD(price)}
            </span>

            <span className="text-xs text-zinc-400 sm:text-sm">
              Bs {formatVES(price * exchangeRate)}
            </span>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
          {description}
        </p>

        <button
          onClick={() =>
            onAddToCart({
              id,
              name,
              price,
              image,
            })
          }
          className="mt-6 w-full rounded-xl bg-yellow-600 px-4 py-4 font-semibold text-black transition hover:bg-yellow-500"
        >
          Add to Cart
        </button>
      </div>
    </div>
  )
}