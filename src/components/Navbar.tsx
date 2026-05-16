"use client";

import Image from "next/image";
import { ShoppingCart } from "lucide-react";

type NavbarProps = {
  cartItemsCount: number;
  onCartClick: () => void;
};

const navItems = [
  { label: "INICIO", href: "#inicio", colorClass: "text-white" },
  { label: "MENÚ", href: "#menu", colorClass: "text-white" },
  { label: "WHATSAPP", href: "#whatsapp", colorClass: "text-emerald-400" },
  { label: "INSTAGRAM", href: "#instagram", colorClass: "text-fuchsia-300" },
];

export default function Navbar({
  cartItemsCount,
  onCartClick,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="relative overflow-hidden border-b border-black/10 bg-gradient-to-r from-[#8c3300] via-[#b86500] to-[#d89a08] shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
        {/* brillo suave */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_45%)]" />

        {/* fila principal */}
        <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <a
            href="#inicio"
            className="flex min-w-0 items-center gap-3 transition-transform duration-200 hover:scale-[1.01]"
          >
            <div className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16">
              <Image
                src="/logo-bambucha.png"
                alt="La Bambucha Grill Burger"
                fill
                className="object-contain"
                priority
              />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                LA BAMBUCHA
              </h1>
              <p className="truncate text-sm font-semibold uppercase tracking-[0.35em] text-[#fff0c2] sm:text-base">
                GRILL BURGER
              </p>
            </div>
          </a>

          <button
            type="button"
            onClick={onCartClick}
            aria-label="Abrir carrito"
            className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-[#ff4b00] via-[#ff8c00] to-[#ffd000] text-white shadow-[0_10px_25px_rgba(0,0,0,0.25)] transition-all duration-200 hover:scale-105 hover:shadow-[0_14px_30px_rgba(0,0,0,0.3)]"
          >
            <ShoppingCart className="h-8 w-8" strokeWidth={2.2} />
            {cartItemsCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#ffe033] px-1 text-xs font-black text-[#5a3000] shadow-md">
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>

        {/* navegación integrada */}
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
          <div className="rounded-full border border-white/10 bg-[rgba(88,34,0,0.32)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.18)] backdrop-blur-md">
            <nav className="scrollbar-hide flex items-center justify-start gap-2 overflow-x-auto sm:justify-center">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-extrabold tracking-[0.18em] transition-all duration-200 hover:bg-white/10 hover:scale-[1.02] ${item.colorClass}`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}