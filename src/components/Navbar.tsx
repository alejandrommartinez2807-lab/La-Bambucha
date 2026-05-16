"use client"

import { ShoppingCart, Phone, AtSign } from "lucide-react"

type NavbarProps = {
  totalItems: number
  onOpenCart: () => void
}

const desktopLinks = [
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

const mobileLinks = [
  { label: "Menú", href: "#menu" },
  { label: "Ubicación", href: "#ubicacion" },
  { label: "Reseña", href: "#reseña" },
  {
    label: "Instagram",
    href: "https://www.instagram.com/la_bambucha_burguer/",
    external: true,
  },
]

export default function Navbar({ totalItems, onOpenCart }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full overflow-hidden bg-[#9b5b00] shadow-[0_10px_30px_rgba(93,43,0,0.28)]">
      <div className="bg-[linear-gradient(90deg,#990000_0%,#d63600_45%,#d9a716_100%)] text-[#fff6d7]">
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

      <div className="bg-[linear-gradient(90deg,#6d3500_0%,#9a6100_52%,#b97800_100%)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <a href="#inicio" className="flex min-w-0 items-center gap-3">
            <img
              src="/logo-bambucha.png"
              alt="La Bambucha Grill Burger"
              className="h-16 w-16 shrink-0 object-contain drop-shadow-[0_0_18px_rgba(255,122,0,0.55)] sm:h-16 sm:w-16"
            />

            <div className="min-w-0">
              <p className="truncate text-[1.55rem] font-black uppercase leading-none tracking-[-0.05em] text-white drop-shadow-[0_3px_0_rgba(70,22,0,0.32)] sm:text-2xl">
                La Bambucha
              </p>
              <p className="mt-1 text-sm font-black uppercase tracking-[0.32em] text-[#ffd96e]">
                Grill Burger
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            {desktopLinks.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-black uppercase tracking-[0.12em] text-white transition hover:text-[#ffd96e]"
                >
                  {link.label}
                </a>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-black uppercase tracking-[0.12em] text-white transition hover:text-[#ffd96e]"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          <button
            onClick={onOpenCart}
            className="relative inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.15rem] bg-gradient-to-br from-red-700 via-orange-500 to-yellow-400 text-white shadow-[0_0_24px_rgba(220,92,0,0.40)] transition hover:scale-105 sm:h-14 sm:w-14"
            aria-label="Abrir carrito"
          >
            <ShoppingCart size={26} />
            <span className="absolute -right-1 -top-1 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-yellow-300 px-1 text-xs font-black text-[#421800]">
              {totalItems}
            </span>
          </button>
        </div>

        <div className="lg:hidden">
          <nav className="grid grid-cols-4 border-t border-yellow-300/18 bg-[linear-gradient(90deg,#9b0000_0%,#bf3d00_45%,#bd7c00_100%)]">
            {mobileLinks.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-12 items-center justify-center border-r border-yellow-200/10 px-2 text-center text-[0.72rem] font-black uppercase tracking-[0.12em] text-white last:border-r-0"
                >
                  {link.label}
                </a>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="flex h-12 items-center justify-center border-r border-yellow-200/10 px-2 text-center text-[0.72rem] font-black uppercase tracking-[0.12em] text-white last:border-r-0"
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