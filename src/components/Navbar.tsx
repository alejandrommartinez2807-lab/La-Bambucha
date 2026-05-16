"use client"

import { ShoppingCart } from "lucide-react"

type NavbarProps = {
  totalItems: number
  onOpenCart: () => void
}

const navItems = [
  {
    label: "INICIO",
    href: "#inicio",
    className: "text-white",
  },
  {
    label: "MENÚ",
    href: "#menu",
    className: "text-white",
  },
  {
    label: "WHATSAPP",
    href: "#contacto",
    className: "text-emerald-300",
  },
  {
    label: "INSTAGRAM",
    href: "https://www.instagram.com/la_bambucha_burguer/",
    className: "text-fuchsia-300",
    external: true,
  },
]

export default function Navbar({ totalItems, onOpenCart }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="relative overflow-hidden bg-[linear-gradient(90deg,#8b3100_0%,#b86600_48%,#d89a08_100%)] shadow-[0_10px_28px_rgba(0,0,0,0.18)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_45%)]" />

        {/* Logo + carrito */}
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <a href="#inicio" className="flex min-w-0 items-center gap-3">
            <img
              src="/logo-bambucha.png"
              alt="La Bambucha Grill Burger"
              className="h-14 w-14 shrink-0 object-contain drop-shadow-[0_0_18px_rgba(255,120,0,0.45)] sm:h-16 sm:w-16"
            />

            <div className="min-w-0">
              <p className="truncate text-2xl font-black uppercase leading-none tracking-tight text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.22)] sm:text-3xl">
                La Bambucha
              </p>
              <p className="mt-1 truncate text-sm font-black uppercase tracking-[0.32em] text-yellow-100 sm:text-base">
                Grill Burger
              </p>
            </div>
          </a>

          <button
            type="button"
            onClick={onOpenCart}
            aria-label="Abrir carrito"
            className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] bg-[linear-gradient(135deg,#e42300_0%,#ff7a00_55%,#ffd21a_100%)] text-white shadow-[0_10px_28px_rgba(0,0,0,0.28)] transition hover:scale-105"
          >
            <ShoppingCart size={31} strokeWidth={2.2} />

            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-yellow-300 px-2 text-xs font-black text-[#5c2500] shadow-md">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Menú estilo limpio como la página blanca */}
        <div className="relative border-t border-white/10 bg-black/8">
          <nav className="mx-auto grid max-w-4xl grid-cols-4 items-center px-2 sm:px-6">
            {navItems.map((item) => {
              const linkClass = [
                "flex h-[58px] items-center justify-center text-center",
                "text-[0.74rem] font-black uppercase tracking-[0.14em]",
                "transition duration-200 hover:bg-white/10",
                "sm:text-sm sm:tracking-[0.18em]",
                item.className,
              ].join(" ")

              if (item.external) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className={linkClass}
                  >
                    {item.label}
                  </a>
                )
              }

              return (
                <a key={item.label} href={item.href} className={linkClass}>
                  {item.label}
                </a>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}