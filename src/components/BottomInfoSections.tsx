"use client"

import { MapPin, MessageCircle, Star } from "lucide-react"

const GOOGLE_MAPS_LINK = "https://maps.app.goo.gl/EiWggvQSYuMhU66K8"
const REVIEW_LINK = "https://maps.app.goo.gl/EiWggvQSYuMhU66K8"
const WHATSAPP_LINK = "https://wa.me/584244721722"

const sections = [
  {
    id: "ubicacion",
    eyebrow: "Encuéntranos",
    title: "Visita La Bambucha",
    description:
      "Abre nuestra ubicación en Google Maps y ven por hamburguesas, perritos, pepitos, shawarmas, parrillas, combos y bebidas al estilo Bambucha.",
    buttonText: "Abrir ubicación",
    href: GOOGLE_MAPS_LINK,
    icon: MapPin,
    align: "left",
  },
  {
    id: "resena",
    eyebrow: "Tu opinión cuenta",
    title: "Agrega tu reseña",
    description:
      "Si ya probaste La Bambucha, déjanos tu reseña en Google Maps y ayúdanos a seguir creciendo.",
    buttonText: "Escribir reseña",
    href: REVIEW_LINK,
    icon: Star,
    align: "right",
  },
  {
    id: "contacto",
    eyebrow: "La Bambucha Grill Burger",
    title: "Haz tu pedido por WhatsApp",
    description:
      "Combos, hamburguesas, perritos, pepitos, shawarmas, parrillas, delicias y bebidas. Escríbenos y arma tu pedido directo por WhatsApp.",
    buttonText: "Pedir ahora",
    href: WHATSAPP_LINK,
    icon: MessageCircle,
    align: "left",
  },
]

export default function BottomInfoSections() {
  return (
    <section className="relative overflow-hidden bg-[#d08a00] px-4 py-14 sm:px-6 md:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,230,105,0.38),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/25 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/25 to-transparent" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 md:gap-10">
        {sections.map((section) => {
          const Icon = section.icon
          const isRight = section.align === "right"

          return (
            <section key={section.id} id={section.id} className="scroll-mt-36">
              <div
                className={[
                  "relative overflow-hidden rounded-[2rem] border border-yellow-300/25 bg-[linear-gradient(135deg,#3b1205_0%,#702306_48%,#a85500_100%)] shadow-[0_24px_55px_rgba(0,0,0,0.32)]",
                  isRight ? "md:ml-auto md:w-[88%]" : "md:mr-auto md:w-[88%]",
                ].join(" ")}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,213,63,0.22),transparent_40%)]" />
                <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-yellow-300/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-28 -left-24 h-56 w-56 rounded-full bg-red-600/25 blur-3xl" />

                <div
                  className={[
                    "relative grid items-center gap-7 px-5 py-10 sm:px-8 sm:py-12 md:grid-cols-[1fr_auto] md:px-12",
                    isRight ? "md:text-right" : "md:text-left",
                  ].join(" ")}
                >
                  <div className="text-center md:text-inherit">
                    <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-300 sm:text-sm">
                      {section.eyebrow}
                    </p>

                    <h2 className="mx-auto mt-4 max-w-3xl text-[2.4rem] font-black uppercase leading-[0.92] text-white drop-shadow-[0_5px_0_rgba(0,0,0,0.28)] sm:text-6xl md:mx-0 md:text-7xl">
                      {section.title}
                    </h2>

                    <p className="mx-auto mt-5 max-w-2xl text-base font-bold leading-7 text-yellow-50/95 sm:text-lg md:mx-0">
                      {section.description}
                    </p>
                  </div>

                  <div
                    className={[
                      "flex justify-center",
                      isRight ? "md:justify-start md:order-first" : "md:justify-end",
                    ].join(" ")}
                  >
                    <a
                      href={section.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[58px] items-center justify-center gap-3 rounded-full bg-gradient-to-r from-red-700 via-orange-500 to-yellow-400 px-8 py-4 text-center text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_16px_35px_rgba(0,0,0,0.28)] transition hover:scale-[1.03] sm:px-10 sm:text-base"
                    >
                      <Icon size={22} />
                      {section.buttonText}
                    </a>
                  </div>
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </section>
  )
}