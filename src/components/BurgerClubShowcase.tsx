import { siteConfig } from "@/config/site"

export default function BurgerClubShowcase() {
  return (
    <section className="bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="overflow-hidden rounded-[2rem] border border-red-900/50 bg-zinc-950 shadow-2xl shadow-black/60">
          <img
            src="/burger-club/menu-perros-burger-club.png"
            alt="Menú Burger Club"
            className="w-full object-cover"
          />
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-yellow-500/30 bg-zinc-950 shadow-2xl shadow-black/60">
          <img
            src="/burger-club/galeria-queso.png"
            alt="Ingredientes de calidad Burger Club"
            className="w-full object-cover"
          />
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-red-900/50 bg-zinc-950 shadow-2xl shadow-black/60">
          <img
            src="/burger-club/equipo-burger-club.png"
            alt="Equipo Burger Club"
            className="w-full object-cover"
          />
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-red-900/50 bg-zinc-950 shadow-2xl shadow-black/60">
          <img
            src="/burger-club/footer-whatsapp-instagram.png"
            alt="Contacto Burger Club"
            className="w-full object-cover"
          />
        </div>

        <div className="rounded-[2rem] border border-yellow-500/30 bg-gradient-to-br from-red-950 to-black p-6 text-center">
          <h2 className="text-3xl font-black uppercase text-yellow-400">
            ¿Listo para probar algo brutal?
          </h2>

          <p className="mt-3 text-zinc-200">
            Haz tu pedido por WhatsApp y disfruta los perros más brutales de la ciudad.
          </p>

          <a
            href={`https://wa.me/${siteConfig.business.whatsapp}?text=${encodeURIComponent(
              "Hola, quiero hacer un pedido en Burger Club."
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block rounded-xl bg-green-500 px-8 py-4 font-black uppercase text-white transition active:scale-[0.97]"
          >
            Escribir por WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}