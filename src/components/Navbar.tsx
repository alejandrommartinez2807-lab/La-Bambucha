"use client"

import { Phone, ShoppingCart } from "lucide-react"

type NavbarProps = {
  totalItems: number
  onOpenCart: () => void
}

export default function Navbar({ totalItems, onOpenCart }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-orange-500/30 bg-black/90 backdrop-blur-xl">
      <div className="hidden border-b border-orange-500/20 bg-gradient-to-r from-black via-red-950 to-black px-4 py-2 text-sm font-bold text-orange-300 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone size={16} />
            <span>Tel: 04244721722</span>
          </div>

          <a
            href="https://www.instagram.com/la_bambucha_burguer/"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-yellow-400"
          >
            @la_bambucha_burguer
          </a>
        </div>
      </div>

      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <a href="#inicio" className="flex items-center gap-3">
          <img
            src="/logo-bambucha.png"
            alt="La Bambucha Grill Burger"
            className="h-16 w-16 object-contain drop-shadow-[0_0_18px_rgba(255,90,0,0.85)] md:h-20 md:w-20"
          />

          <div className="leading-tight">
            <p className="text-lg font-black uppercase text-white md:text-2xl">
              La Bambucha
            </p>

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-400">
              Grill Burger
            </p>
          </div>
        </a>

        <div className="hidden items-center gap-8 font-black uppercase tracking-wide md:flex">
          <a
            href="#inicio"
            className="text-white transition hover:text-yellow-400"
          >
            Inicio
          </a>

          <a
            href="#menu"
            className="text-white transition hover:text-yellow-400"
          >
            Menú
          </a>

          <a
            href="#contacto"
            className="text-white transition hover:text-yellow-400"
          >
            Contacto
          </a>

          <a
            href="https://www.instagram.com/la_bambucha_burguer/"
            target="_blank"
            rel="noreferrer"
            className="text-orange-400 transition hover:text-yellow-400"
          >
            Instagram
          </a>
        </div>

        <button
          onClick={onOpenCart}
          className="relative rounded-full border border-orange-500/40 bg-gradient-to-r from-red-700 to-orange-500 p-3 text-white shadow-[0_0_22px_rgba(255,90,0,0.35)] transition hover:scale-105"
          aria-label="Abrir carrito"
        >
          <ShoppingCart size={22} />

          {totalItems > 0 && (
            <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-xs font-black text-black">
              {totalItems}
            </span>
          )}
        </button>
      </nav>

      <div className="flex justify-center gap-5 border-t border-orange-500/20 px-4 py-2 text-sm font-black uppercase md:hidden">
        <a href="#inicio" className="text-white">
          Inicio
        </a>

        <a href="#menu" className="text-orange-400">
          Menú
        </a>

        <a href="#contacto" className="text-white">
          Contacto
        </a>

        <a
          href="https://www.instagram.com/la_bambucha_burguer/"
          target="_blank"
          rel="noreferrer"
          className="text-yellow-400"
        >
          Instagram
        </a>
      </div>
    </header>
  )
}