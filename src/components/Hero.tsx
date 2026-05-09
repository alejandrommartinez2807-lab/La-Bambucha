export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-black px-4 pt-24 text-white sm:px-6">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2000')",
        }}
      />

      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <p className="mb-5 text-xs uppercase tracking-[0.35em] text-yellow-500 sm:text-sm">
          Fast Food Premium
        </p>

        <h1 className="max-w-4xl text-5xl font-light leading-none sm:text-7xl lg:text-8xl">
          Ordena tu
          <span className="block italic text-yellow-500">
            comida favorita
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
          Perros, hamburguesas, pizzas, postres y bebidas con precios en dólares y bolívares actualizados.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <a
            href="#menu"
            className="rounded bg-yellow-600 px-8 py-4 text-center text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-yellow-500"
          >
            Ver menú
          </a>

          <button className="rounded border border-white/20 px-8 py-4 text-sm uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black">
            Contacto
          </button>
        </div>
      </div>
    </section>
  )
}
