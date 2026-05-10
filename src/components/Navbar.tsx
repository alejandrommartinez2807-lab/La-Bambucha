import { siteConfig } from "@/config/site"

type NavbarProps = {
  totalItems: number
  onOpenCart: () => void
}

export default function Navbar({
  totalItems,
  onOpenCart,
}: NavbarProps) {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-red-900/50 bg-black/90 px-4 py-3 text-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <a href="#" className="flex items-center gap-3">
          <img
            src="/burger-club/logo-burger-club.png"
            alt={siteConfig.business.name}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-yellow-400/70"
          />

          <div className="leading-tight">
            <p className="text-lg font-black text-yellow-400">
              Burger
            </p>
            <p className="-mt-1 text-sm font-bold text-yellow-400">
              Club
            </p>
          </div>
        </a>

        <button
          onClick={onOpenCart}
          className="rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-red-950/40 transition active:scale-[0.97]"
        >
          Carrito ({totalItems})
        </button>
      </div>
    </nav>
  )
}