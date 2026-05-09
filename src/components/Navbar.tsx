type NavbarProps = {
  totalItems: number
  onOpenCart: () => void
}

export default function Navbar({
  totalItems,
  onOpenCart,
}: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 p-6 text-white backdrop-blur">

      <div className="mx-auto flex max-w-7xl items-center justify-between">

        <h2 className="text-2xl font-bold">
          Maison Noir
        </h2>

        <button
          onClick={onOpenCart}
          className="rounded bg-yellow-500 px-5 py-3 font-semibold text-black"
        >
          Cart ({totalItems})
        </button>

      </div>

    </nav>
  )
}