"use client"

import { useState } from "react"
import { useExchangeRate } from "@/hooks/useExchangeRate"
import { useCart } from "@/hooks/useCart"

import Navbar from "@/components/Navbar"
import Hero from "@/components/Hero"
import Products from "@/components/Products"
import CartDrawer from "@/components/CartDrawer"
import FirulaisVideoShowcase from "@/components/FirulaisVideoShowcase"

export default function Home() {
  const cart = useCart()
  const exchange = useExchangeRate()
  const [isCartOpen, setIsCartOpen] = useState(false)

  return (
    <main className="bg-black text-white">
      <Navbar
        totalItems={cart.totalItems}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <Hero />

      <FirulaisVideoShowcase />

      <Products
        onAddToCart={cart.addItem}
        exchangeRate={exchange.rate}
      />

      <CartDrawer
        items={cart.items}
        totalPrice={cart.totalPrice}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        increaseQuantity={cart.increaseQuantity}
        decreaseQuantity={cart.decreaseQuantity}
        removeItem={cart.removeItem}
        exchangeRate={exchange.rate}
      />
    </main>
  )
}