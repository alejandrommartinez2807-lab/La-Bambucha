"use client"

import { useState } from "react"
import { useExchangeRate } from "@/hooks/useExchangeRate"
import Navbar from "@/components/Navbar"
import Hero from "@/components/Hero"
import Products from "@/components/Products"
import CartDrawer from "@/components/CartDrawer"

import { useCart } from "@/hooks/useCart"

export default function Home() {
  const cart = useCart()
  const exchange = useExchangeRate()
  console.log("EXCHANGE DESDE PAGE:", exchange.rate)
  const [isCartOpen, setIsCartOpen] = useState(false)

  return (
    <main className="bg-black text-white">

      <Navbar
        totalItems={cart.totalItems}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <Hero />

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