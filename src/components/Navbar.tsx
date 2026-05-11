"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Menu, ShoppingCart, X } from "lucide-react"
import { siteConfig } from "@/config/site"

type NavbarProps = {
  totalItems: number
  onOpenCart: () => void
}

export default function Navbar({ totalItems, onOpenCart }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const whatsappText = encodeURIComponent(
    "Hola, me gustaría hacer un pedido en Burger Club."
  )

  function closeMenu() {
    setIsMenuOpen(false)
  }

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55 }}
        className="fixed left-0 right-0 top-0 z-50 border-b border-red-900/35 bg-black/88 px-4 py-3 text-white shadow-2xl shadow-black/40 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <a href="#" className="flex min-w-0 items-center gap-3" onClick={closeMenu}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black shadow-lg shadow-red-950/50 ring-1 ring-yellow-400/25 sm:h-16 sm:w-16">
              <img
                src="/logo-burger-club.png"
                alt={siteConfig.business.name}
                className="h-full w-full object-contain"
              />
            </div>

            <div className="block leading-none">
              <p className="text-lg font-black uppercase tracking-[-0.04em] text-yellow-400 sm:text-xl">
                Burger
              </p>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-red-500 sm:text-base">
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

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMenuOpen((current) => !current)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-zinc-950 text-white shadow-lg shadow-black/30 md:hidden"
              aria-label="Abrir menú"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <button
              onClick={onOpenCart}
              className="relative flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-3 text-sm font-black uppercase text-white shadow-lg shadow-red-950/40 transition hover:-translate-y-0.5 hover:from-red-500 hover:to-yellow-500 active:scale-[0.97] sm:h-auto sm:px-4 sm:py-3"
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

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.22 }}
            className="fixed left-4 right-4 top-[86px] z-40 rounded-3xl border border-white/10 bg-zinc-950/95 p-4 text-white shadow-2xl shadow-black/60 backdrop-blur-xl md:hidden"
          >
            <div className="grid gap-3">
              <a
                href="#menu"
                onClick={closeMenu}
                className="rounded-2xl bg-white/[0.05] px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-zinc-200"
              >
                Menú
              </a>

              <a
                href="#firulais"
                onClick={closeMenu}
                className="rounded-2xl bg-white/[0.05] px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-zinc-200"
              >
                Firulais
              </a>

              <a
                href={`https://wa.me/${siteConfig.business.whatsapp}?text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenu}
                className="rounded-2xl bg-green-500 px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-white"
              >
                WhatsApp
              </a>

              <button
                onClick={() => {
                  closeMenu()
                  onOpenCart()
                }}
                className="rounded-2xl bg-gradient-to-r from-red-600 to-yellow-400 px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-black"
              >
                Abrir carrito
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}