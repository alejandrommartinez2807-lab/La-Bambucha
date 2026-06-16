"use client"

import { ShoppingCart } from "lucide-react"
import {
  DEFAULT_PUBLIC_BUSINESS_CONFIG,
  buildWhatsappUrl,
  type PublicBusinessConfig,
} from "@/types/publicBusinessConfig"

type NavbarProps = {
  totalItems: number
  onOpenCart: () => void
  businessConfig?: PublicBusinessConfig
}

export default function Navbar({
  totalItems,
  onOpenCart,
  businessConfig = DEFAULT_PUBLIC_BUSINESS_CONFIG,
}: NavbarProps) {
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
      href: buildWhatsappUrl(businessConfig.mainWhatsapp),
      className: "text-emerald-300",
      external: true,
    },
    {
      label: "INSTAGRAM",
      href: businessConfig.instagramUrl,
      className: "text-fuchsia-300",
      external: true,
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="relative overflow-hidden bg-[linear-gradient(90deg,#8f3100_0%,#ad5600_40%,#c88000_72%,#d99b08_100%)] shadow-[0_10px_28px_rgba(0,0,0,0.18)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_55%_0%,rgba(255,226,115,0.22),transparent_44%)]" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#641800]/35 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#6d4200]/25 to-transparent" />

        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 pb-2 pt-3 sm:px-6 lg:px-8">
          <a href="#inicio" className="flex min-w-0 items-center gap-3">
            <img
              src="/logo-bambucha.png"
              alt={businessConfig.businessName}
              className="h-[58px] w-[58px] shrink-0 object-contain drop-shadow-[0_0_16px_rgba(255,120,0,0.45)] sm:h-16 sm:w-16"
            />

            <div className="min-w-0">
              <p className="truncate text-[1.8rem] font-black uppercase leading-none tracking-tight text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.22)] sm:text-3xl">
                {businessConfig.businessName}
              </p>
              <p className="mt-1 truncate text-[0.95rem] font-black uppercase tracking-[0.32em] text-yellow-100 sm:text-base">
                {businessConfig.businessShortDescription}
              </p>
            </div>
          </a>

          <button
            type="button"
            onClick={onOpenCart}
            aria-label="Abrir carrito"
            className="relative flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[1.25rem] bg-[linear-gradient(135deg,#e42300_0%,#ff7a00_55%,#ffd21a_100%)] text-white shadow-[0_10px_24px_rgba(0,0,0,0.25)] transition hover:scale-105 sm:h-16 sm:w-16"
          >
            <ShoppingCart size={30} strokeWidth={2.2} />

            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-yellow-300 px-2 text-xs font-black text-[#5c2500] shadow-md">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        <div className="relative mx-auto max-w-7xl px-3 pb-3 sm:px-6 lg:px-8">
          <nav className="mx-auto grid max-w-4xl grid-cols-4 items-center rounded-[1.2rem] bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm">
            {navItems.map((item) => {
              const linkClass = [
                "flex h-[46px] items-center justify-center text-center",
                "text-[0.72rem] font-black uppercase tracking-[0.12em]",
                "transition duration-200 hover:bg-white/10",
                "first:rounded-l-[1.2rem] last:rounded-r-[1.2rem]",
                "sm:h-[52px] sm:text-sm sm:tracking-[0.18em]",
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
