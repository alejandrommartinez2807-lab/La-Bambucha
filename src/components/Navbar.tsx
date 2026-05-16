"use client"

import { ShoppingCart, Phone, AtSign } from "lucide-react"

type NavbarProps = {
  totalItems: number
  onOpenCart: () => void
}

const navLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Menú", href: "#menu" },
  { label: "Ubicación", href: "#ubicacion" },
  { label: "Reseña", href: "#reseña" },
  { label: "Contacto", href: "#contacto" },
  {
    label: "Instagram",
    href: "https://www.instagram.com/la_bambucha_burguer/",
    external: true,
  },
]

export default function Navbar({ totalItems, onOpenCart }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="border-b border-yellow-300/25 bg-[linear-gradient(90deg,#9b0000_0%,#d73700_42%,#e0a916_100%)] text-[#fff3cf]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs font-black uppercase tracking-[0.08em] sm:text-sm">
          <a
            href="tel:04244721722"
            className="flex items-center gap-2 transition hover:opacity-90"
          >
            <Phone size={14} />
            <span>Tel: 04244721722</span>
          </a>

          <a
            href="https://www.instagram.com/la_bambucha_burguer/"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 transition hover:opacity-90 sm:flex"
          >
            <AtSign size={14} />
            <span>@la_bambucha_burguer</span>
          </a>
        </div>
      </div>

      <div className="border-b border-[#b96b00]/35 bg-[linear-gradient(90deg,#6b3500_0%,#935900_45%,#b97900_100%)] shadow-[0_10px_34px_rgba(96,43,0,0.28)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <a href="#inicio" className="flex min-w-0 items-center gap-3">
            <img
              src="/logo-bambucha.png"
              alt="La Bambucha Grill Burger"
              className="h-14 w-14 rounded-full object-contain drop-shadow-[0_0_18px_rgba(255,120,0,0.55)] sm:h-16 sm:w-16"
            />

            <div className="min-w-0">
              <p className="truncate text-2xl font-black uppercase leading-none tracking-[-0.04em] text-white drop-shadow-[0_2px_0_rgba(70,20,0,0.35)]">
                La Bambucha
              </p>
              <p className="mt-1 text-sm font-black uppercase tracking-[0.32em] text-[#ffd56e]">
                Grill Burger
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-black uppercase tracking-[0.12em] text-white transition hover:text-[#ffd56e]"
                >
                  {link.label}
                </a>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-black uppercase tracking-[0.12em] text-white transition hover:text-[#ffd56e]"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          <button
            onClick={onOpenCart}
            className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-red-700 via-orange-500 to-yellow-400 text-white shadow-[0_0_24px_rgba(220,92,0,0.40)] transition hover:scale-105"
            aria-label="Abrir carrito"
          >
            <ShoppingCart size={26} />
            <span className="absolute -right-1 -top-1 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-yellow-300 px-1 text-xs font-black text-[#421800]">
              {totalItems}
            </span>
          </button>
        </div>

        <div className="overflow-x-auto border-t border-yellow-300/20 bg-[linear-gradient(90deg,#8b0000_0%,#b84400_45%,#c98500_100%)] lg:hidden">
          <nav className="flex min-w-max items-center justify-start gap-6 px-4 py-3">
            {navLinks.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="whitespace-nowrap text-sm font-black uppercase tracking-[0.12em] text-white transition hover:text-[#ffe08f]"
                >
                  {link.label}
                </a>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="whitespace-nowrap text-sm font-black uppercase tracking-[0.12em] text-white transition hover:text-[#ffe08f]"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}