"use client"

import { useEffect, useState } from "react"

const CART_STORAGE_KEY = "bambucha_cart_v3"

export type CartItem = {
  id: number
  name: string
  price: number
  image: string
  category: string
  quantity: number
  note?: string
  noteEnabled?: boolean
}

export type ProductToAdd = {
  id: number
  name: string
  price: number
  image: string
  category: string
}

function normalizeCartItems(items: unknown): CartItem[] {
  if (!Array.isArray(items)) return []

  return items
    .filter((item) => {
      return (
        item &&
        typeof item === "object" &&
        "id" in item &&
        "name" in item &&
        "price" in item
      )
    })
    .map((item: any) => ({
      id: Number(item.id),
      name: String(item.name),
      price: Number(item.price),
      image: String(item.image ?? ""),
      category: String(item.category ?? ""),
      quantity: Number(item.quantity ?? 1),
      note: String(item.note ?? ""),
      noteEnabled: Boolean(item.noteEnabled ?? false),
    }))
    .filter((item) => item.id && item.name && item.price >= 0)
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY)

      if (savedCart) {
        setItems(normalizeCartItems(JSON.parse(savedCart)))
      }
    } catch {
      setItems([])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function addItem(product: ProductToAdd) {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id)

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [
        ...currentItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
          quantity: 1,
          note: "",
          noteEnabled: false,
        },
      ]
    })
  }

  function removeItem(id: number) {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id))
  }

  function increaseQuantity(id: number) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    )
  }

  function decreaseQuantity(id: number) {
    setItems((currentItems) =>
      currentItems
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function updateItemNote(id: number, note: string) {
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, note } : item))
    )
  }

  function updateItemNoteEnabled(id: number, noteEnabled: boolean) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              noteEnabled,
              note: noteEnabled ? item.note ?? "" : "",
            }
          : item
      )
    )
  }

  function clearCart() {
    setItems([])
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  return {
    items,
    addItem,
    removeItem,
    increaseQuantity,
    decreaseQuantity,
    updateItemNote,
    updateItemNoteEnabled,
    clearCart,
    totalItems,
    totalPrice,
  }
}