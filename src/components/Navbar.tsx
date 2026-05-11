"use client"

import { motion } from "motion/react"
import { Menu, ShoppingCart } from "lucide-react"
import { siteConfig } from "@/config/site"

type NavbarProps = {
  totalItems: number
  onOpenCart: () => void
}

export default function Navbar({ totalItems, onOpenCart }: NavbarProps) {
  const whatsappText = encodeURIComponent(
    "Hola, me gustaría hacer un pedido en Burger Club."
  )

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55 }}
      className="fixed left-0 right-0 top-0 z-50 border-b border-red-900/40 bg-black/90 px-4 py-3 text-white backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <a href="#" className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-black shadow-lg shadow-red-950/50 sm:h-16 sm:w-16">
            <img
              src="/logo-burger-club.png"
              alt={siteConfig.business.name}
              className="h-full w-full object-contain"
            />
          </div>

          <div className="hidden leading-none sm:block">
            <p className="text-xl font-black uppercase tracking-[-0.04em] text-yellow-400">
              Burger
            </p>
            <p className="text-base font-black uppercase tracking-[0.18em] text-red-500">
              Club
            </p>
          </div>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#menu"
            className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-300 transition hover:text-yellow-400"
          >
            Menú
          </a>

          <a
            href="#firulais"
            className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-300 transition hover:text-yellow-400"
          >
            Firulais
          </a>

          <a
            href={`https://wa.me/${siteConfig.business.whatsapp}?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-300 transition hover:text-yellow-400"
          >
            WhatsApp
          </a>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-zinc-950 text-white md:hidden"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>

          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-4 py-3 text-sm font-black uppercase text-white shadow-lg shadow-red-950/40 transition hover:-translate-y-0.5 hover:from-red-500 hover:to-yellow-500 active:scale-[0.97]"
          >
            <ShoppingCart size={18} />

            <span className="hidden sm:inline">Carrito</span>

            <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-yellow-400 px-1 text-xs font-black text-black ring-2 ring-black">
              {totalItems}
            </span>
          </button>
        </div>
      </div>
    </motion.nav>
  )
}