import type { NextConfig } from "next"

// Pantallas del PERSONAL. Cargan ya autenticadas (la clave vive en el
// almacenamiento del navegador), así que si se pueden meter en un iframe ajeno
// también se puede hacer clickjacking sobre ellas: el atacante manda un enlace
// al cajero, monta encima un overlay transparente y el clic que el cajero cree
// de otra cosa cae sobre "Anular pedido" o sobre el botón de cobro.
//
// Brotherhood, que es el mismo motor, lo tenía desde su auditoría del
// 2026-08-02; a esta copia le faltaba (auditoría 2026-08-03).
const STAFF_PATHS = ["/local-santo/:path*", "/pedidos"]

const STAFF_SECURITY_HEADERS = [
  // Cinturón y tirantes: X-Frame-Options lo entienden todos los navegadores;
  // frame-ancestors es el sucesor y cubre los que ignoran el primero.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  // El panel del personal no tiene nada que hacer en un buscador.
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
]

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://192.168.0.240:3000",
    "http://192.168.0.120:3000",
    "192.168.0.240:3000",
    "192.168.0.120:3000",
  ],
  async headers() {
    return STAFF_PATHS.map((source) => ({
      source,
      headers: STAFF_SECURITY_HEADERS,
    }))
  },
}

export default nextConfig