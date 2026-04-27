"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoriteItem {
  id: string;
  nombre: string;
  precio: number;
  imagen_url: string;
  categoria_id: string;
}

interface FavoritesStore {
  favorites: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (item: FavoriteItem) => void;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      
      addFavorite: (item) => {
        const currentFavorites = get().favorites;
        if (!currentFavorites.some((f) => f.id === item.id)) {
          set({ favorites: [...currentFavorites, item] });
        }
      },
      
      removeFavorite: (id) => {
        set({ favorites: get().favorites.filter((f) => f.id !== id) });
      },
      
      isFavorite: (id) => {
        return get().favorites.some((f) => f.id === id);
      },
      
      toggleFavorite: (item) => {
        const currentFavorites = get().favorites;
        const isFav = currentFavorites.some((f) => f.id === item.id);
        
        if (isFav) {
          set({ favorites: currentFavorites.filter((f) => f.id !== item.id) });
        } else {
          set({ favorites: [...currentFavorites, item] });
        }
      },
      
      clearFavorites: () => {
        set({ favorites: [] });
      },
    }),
    {
      name: "favorites-storage",
    }
  )
);
