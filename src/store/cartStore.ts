import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  nombre: string
  precio: number
  cantidad: number
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'cantidad'>) => void
  removeItem: (id: string, decremento?: boolean) => void
  clearCart: () => void
  getTotal: () => number
  getTotalItems: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      // Agregar un producto o incrementar su cantidad si ya existe
  addItem: (product) => set((state) => {
    const existingItem = state.items.find(item => item.id === product.id)
    if (existingItem) {
      return {
        items: state.items.map(item => 
          item.id === product.id 
            ? { ...item, cantidad: item.cantidad + 1 } 
            : item
        )
      }
    }
    return { items: [...state.items, { ...product, cantidad: 1 }] }
  }),

  // Remover un producto (o reducir su cantidad)
  removeItem: (id, decremento = false) => set((state) => {
    const existingItem = state.items.find(item => item.id === id)
    if (existingItem && decremento && existingItem.cantidad > 1) {
      return {
        items: state.items.map(item => 
          item.id === id 
            ? { ...item, cantidad: item.cantidad - 1 } 
            : item
        )
      }
    }
    return {
      items: state.items.filter(item => item.id !== id)
    }
  }),

  clearCart: () => set({ items: [] }),
  
  getTotal: () => {
    return get().items.reduce((total, item) => total + (item.precio * item.cantidad), 0)
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.cantidad, 0)
  }
}), {
  name: 'cart-storage',
}))

