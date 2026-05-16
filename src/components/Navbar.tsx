"use client"

import { ShoppingCart } from "lucide-react"

type NavbarProps = {
  totalItems: number
  onOpenCart: () => void
}

const WHATSAPP_URL = "https://wa.me/584244721722"
const INSTAGRAM_URL = "https://www.instagram.com/la_bambucha_burguer/"

const desktopLinks = [
  { label: "Inicio", href: "#inicio", type: "normal" },
  { label: "Menú", href: "#menu", type: "normal" },
  { label: "WhatsApp", href: WHATSAPP_URL, external: true, type: "whatsapp" },
  { label: "Instagram", href: INSTAGRAM_URL, external: true, type: "instagram" },
]

function getLinkClass(type?: string) {
  if (type === "whatsapp") {
    return "relative text-sm font-black uppercase tracking-[0.14em] text-[#25D366] drop-shadow-[0_2px_0_rgba(10,55,20,0.45)] transition hover:text-[#4cff8b] after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-[#25D366] after:opacity-0 after:transition hover:after:opacity-100"
  }

  if (type === "instagram") {
    return "relative bg-gradient-to-r from-[#feda75] via-[#d62976] to-[#4f5bd5] bg-clip-text text-sm font-black uppercase tracking-[0.14em] text-transparent drop-shadow-[0_2px_0_rgba(80,20,50,0.35)] transition after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-gradient-to-r after:from-[#feda75] after:via-[#d62976] after:to-[#4f5bd5] after:opacity-0 after:transition hover:after:opacity-100"
  }

  return "relative text-sm font-black uppercase tracking-[0.14em] text-white drop-shadow-[0_2px_0_rgba(80,20,0,0.55)] transition hover:text-[#ffe08a] after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-white after:opacity-0 after:transition hover:after:opacity-100"
}

function getMobileLinkClass(type?: string) {
  if (type === "whatsapp") {
    return "relative text-[0.76rem] font-black uppercase tracking-[0.16em] text-[#25D366] drop-shadow-[0_2px_0_rgba(10,55,20,0.50)] transition active:scale-95 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-[#25D366] after:opacity-90"
  }

  if (type === "instagram") {
    return "relative bg-gradient-to-r from-[#feda75] via-[#d62976] to-[#4f5bd5] bg-clip-text text-[0.76rem] font-black uppercase tracking-[0.16em] text-transparent drop-shadow-[0_2px_0_rgba(80,20,50,0.35)] transition active:scale-95 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-gradient-to-r after:from-[#feda75] after:via-[#d62976] after:to-[#4f5bd5] after:opacity-90"
  }

  return "relative text-[0.76rem] font-black uppercase tracking-[0.16em] text-white drop-shadow-[0_2px_0_rgba(80,20,0,0.55)] transition active:scale-95 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-white after:opacity-80"
}

export default function Navbar({ totalItems, onOpenCart }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full overflow-hidden bg-[#a96b00] shadow-[0_10px_30px_rgba(93,43,0,0.25)]">
      <div className="bg-[linear-gradient(90deg,#7c3200_0%,#a96300_48%,#d8a116_100%)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <a href="#inicio" className="flex min-w-0 items-center gap-3">
            <img
              src="/logo-bambucha.png"
              alt="La Bambucha Grill Burger"
              className="h-16 w-16 shrink-0 object-contain drop-shadow-[0_0_18px_rgba(255,122,0,0.55)] sm:h-[4.6rem] sm:w-[4.6rem]"
            />

            <div className="min-w-0">
              <p className="truncate text-[1.45rem] font-black uppercase leading-none tracking-[-0.04em] text-white drop-shadow-[0_3px_0_rgba(70,22,0,0.30)] sm:text-3xl">
                La Bambucha
              </p>

              <p className="mt-1 text-sm font-black uppercase tracking-[0.32em] text-[#ffe08a] sm:text-base">
                Grill Burger
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {desktopLinks.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className={getLinkClass(link.type)}
                >
                  {link.label}
                </a>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className={getLinkClass(link.type)}
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

            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-yellow-300 px-1 text-xs font-black text-[#421800]">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        <div className="lg:hidden">
          <nav className="flex items-center justify-center gap-6 bg-[linear-gradient(90deg,#8a1f00_0%,#c44700_45%,#c98500_100%)] px-4 py-3 shadow-inner shadow-black/10">
            <a href="#inicio" className={getMobileLinkClass("normal")}>
              Inicio
            </a>

            <a href="#menu" className={getMobileLinkClass("normal")}>
              Menú
            </a>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className={getMobileLinkClass("whatsapp")}
            >
              WhatsApp
            </a>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className={getMobileLinkClass("instagram")}
            >
              Instagram
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}