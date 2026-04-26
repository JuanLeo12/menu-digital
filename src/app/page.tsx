"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Search, 
  Info, 
  Heart,
  Star,
  Clock,
  ChevronRight,
  UtensilsCrossed,
  Sparkles
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useToast } from "@/components/Toast";
import CheckoutModal from "@/components/CheckoutModal";
import { createClient } from "@/lib/supabase/client";

type Categoria = { id: string; nombre: string; orden: number };
type Plato = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url: string;
  categoria_id: string;
  disponible: boolean;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12,
    },
  },
};

export default function Home() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [isStoreClosed, setIsStoreClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [activeTab, setActiveTab] = useState<"menu" | "favorites">("menu");
  
  // Predefined particle positions (deterministic for purity)
  const particleData = useMemo(() => [
    { x: 10, y: 20, duration: 2.5 },
    { x: 30, y: 60, duration: 3.2 },
    { x: 50, y: 40, duration: 2.8 },
    { x: 70, y: 80, duration: 3.5 },
    { x: 90, y: 30, duration: 2.2 },
  ], []);

  const cart = useCartStore();
  const favorites = useFavoritesStore();
  const { showToast } = useToast();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const fetchData = async () => {
      const respConf = await supabase.from("configuracion").select("*").eq("id", 1).single();
      if(respConf.data) {
        if (respConf.data.auto_horario && respConf.data.horarios) {
          const now = new Date();
          const day = now.getDay().toString();
          const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
          
          const horarioDia = respConf.data.horarios[day];
          if (horarioDia && horarioDia.abierto) {
            if (currentTime >= horarioDia.abre && currentTime <= horarioDia.cierra) {
              setIsStoreClosed(false);
            } else {
              setIsStoreClosed(true);
            }
          } else {
            setIsStoreClosed(true);
          }
        } else {
          setIsStoreClosed(!respConf.data.local_abierto);
        }
      } else {
        setIsStoreClosed(false);
      }
      
      const [catsRes, platosRes] = await Promise.all([
        supabase
          .from("categorias")
          .select("*")
          .order("orden", { ascending: true }),
        supabase.from("platos").select("*").eq("disponible", true),
      ]);
      if (catsRes.data) setCategorias(catsRes.data);
      if (platosRes.data) setPlatos(platosRes.data);
      setLoading(false);
    };
    fetchData();

    const channel = supabase
      .channel('public_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'schema_menu', table: 'platos' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'schema_menu', table: 'categorias' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'schema_menu', table: 'configuracion' },
        () => {
          fetchData();
        }
      )
      .subscribe((status) => console.log('Client Realtime:', status));

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const currentCatId = categorias.find((c) => c.nombre === categoriaActiva)?.id;
  let platosPorCategoria =
    categoriaActiva === "Todos"
      ? platos
      : platos.filter((p) => p.categoria_id === currentCatId);

  // Filtrar por favoritos si estamos en la pestaña de favoritos
  if (activeTab === "favorites") {
    platosPorCategoria = platosPorCategoria.filter(p => favorites.isFavorite(p.id));
  }

  const platosMostrados =
    busqueda.trim() === ""
      ? platosPorCategoria
      : platosPorCategoria.filter(
          (p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase())
        );

  const handleToggleFavorite = (plato: Plato) => {
    favorites.toggleFavorite({
      id: plato.id,
      nombre: plato.nombre,
      precio: plato.precio,
      imagen_url: plato.imagen_url,
      categoria_id: plato.categoria_id,
    });
    
    const isNowFavorite = favorites.isFavorite(plato.id);
    showToast(
      isNowFavorite 
        ? `❤️ ${plato.nombre} agregado a favoritos` 
        : `💔 ${plato.nombre} eliminado de favoritos`,
      "info"
    );
  };

  const handleAddToCart = (plato: Plato) => {
    cart.addItem({
      id: plato.id,
      nombre: plato.nombre,
      precio: plato.precio,
    });
    showToast(`🛒 ${plato.nombre} agregado al carrito`, "success");
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <motion.div 
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-orange-200 border-t-orange-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-orange-600 font-semibold text-lg">Preparando el menú...</p>
        </motion.div>
      </div>
    );

  return (
    <>
      {isStoreClosed && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white text-center py-4 font-semibold sticky top-0 z-50 shadow-lg"
        >
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-5 h-5" />
            <span>⚠️ Nuestro local se encuentra cerrado en este momento. Vuelve pronto.</span>
          </div>
        </motion.div>
      )}
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 pb-32 font-sans text-slate-900">
        {/* Hero Section Mejorada */}
        <motion.header 
          className="relative h-64 w-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10" />
          <Image
            src="https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?q=80&w=1200&auto=format&fit=crop"
            alt="Portada Pollería"
            fill
            className="object-cover"
            priority
          />
          
          {/* Animated particles */}
          <div className="absolute inset-0 z-10 overflow-hidden">
            {particleData.map((particle, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400/60 rounded-full"
                initial={{ 
                  x: `${particle.x}%`, 
                  y: `${particle.y}%`,
                  scale: 0 
                }}
                animate={{ 
                  y: [null, -20],
                  opacity: [0, 1, 0],
                }}
                transition={{ 
                  duration: particle.duration,
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
              />
            ))}
          </div>

          <div className="absolute z-20 bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </motion.div>
                <span className="text-sm font-medium text-orange-300 uppercase tracking-wider">
                  El mejor sabor de la ciudad
                </span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-2">
                Villa Granja 🍗
              </h1>
              <p className="text-sm text-gray-200 flex items-center gap-2">
                <Info size={14} /> 
                Pide tu delivery o compra en salón
              </p>
            </motion.div>
          </div>
        </motion.header>

        {/* Search Bar Flotante */}
        <motion.div 
          className="px-4 py-4 -mt-8 relative z-30"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="max-w-md mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full blur opacity-25 group-hover:opacity-40 transition-opacity" />
              <div className="relative bg-white/95 backdrop-blur-sm rounded-full shadow-xl flex items-center p-1">
                <Search
                  size={20}
                  className="ml-4 text-gray-400 group-focus-within:text-orange-500 transition-colors"
                />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="¿Qué se te antoja hoy?"
                  className="flex-1 bg-transparent px-4 py-3 text-sm outline-none text-gray-800 placeholder-gray-400"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda("")}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <span className="sr-only">Limpiar búsqueda</span>
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs de Navegación */}
        <motion.div 
          className="px-4 mt-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="max-w-md mx-auto">
            <div className="flex bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 shadow-sm border border-gray-100">
              <button
                onClick={() => setActiveTab("menu")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "menu"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <UtensilsCrossed size={16} />
                Menú
              </button>
              <button
                onClick={() => setActiveTab("favorites")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "favorites"
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Heart size={16} />
                Favoritos
                {favorites.favorites.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === "favorites" 
                      ? "bg-white/20" 
                      : "bg-pink-100 text-pink-600"
                  }`}>
                    {favorites.favorites.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Categorías - Solo mostrar en pestaña de menú */}
        {activeTab === "menu" && (
          <motion.div 
            className="mt-6 px-4 overflow-x-auto no-scrollbar"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex gap-2 min-w-max pb-2 max-w-md mx-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCategoriaActiva("Todos")}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
                  categoriaActiva === "Todos" 
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30" 
                    : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-600"
                }`}
              >
                Todos
              </motion.button>
              {categorias.map((cat) => (
                <motion.button
                  key={cat.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCategoriaActiva(cat.nombre)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
                    categoriaActiva === cat.nombre
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-600"
                  }`}
                >
                  {cat.nombre}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Título de Sección */}
        <motion.div 
          className="px-4 mt-8 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              {activeTab === "favorites" ? "❤️ Tus Favoritos" : categoriaActiva}
            </h2>
            <span className="text-sm text-gray-500 font-medium">
              {platosMostrados.length} {platosMostrados.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>
        </motion.div>

        {/* Grid de Productos */}
        <motion.main 
          className="px-4 mt-4 max-w-md mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {platosMostrados.length === 0 ? (
            <motion.div 
              className="bg-white/80 backdrop-blur-sm p-12 text-center text-gray-500 rounded-3xl border border-gray-100 shadow-sm"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="text-6xl mb-4">
                {activeTab === "favorites" ? "💔" : "🍽️"}
              </div>
              <p className="text-lg font-semibold text-gray-700 mb-2">
                {activeTab === "favorites" 
                  ? "No tienes favoritos aún" 
                  : "No hay platos en esta categoría"}
              </p>
              <p className="text-sm text-gray-500">
                {activeTab === "favorites"
                  ? "Explora el menú y guarda tus platos favoritos"
                  : "Prueba con otra categoría"}
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-4">
              {platosMostrados.map((plato) => {
                const itemEnCarrito = cart.items.find((i) => i.id === plato.id);
                const cantidad = itemEnCarrito?.cantidad || 0;
                const isFavorite = favorites.isFavorite(plato.id);

                return (
                  <motion.div
                    key={plato.id}
                    variants={itemVariants}
                    whileHover={{ y: -2, scale: 1.01 }}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-sm border border-gray-100 flex gap-4 relative overflow-hidden transition-all hover:shadow-lg hover:border-orange-200 group"
                  >
                    {/* Efecto de brillo en hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    {/* Imagen del producto */}
                    <div className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-gray-100 shadow-md">
                      {plato.imagen_url ? (
                        <Image
                          src={plato.imagen_url}
                          alt={plato.nombre}
                          fill
                          sizes="(max-width: 768px) 112px, 112px"
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-gray-100">
                          Sin Img
                        </div>
                      )}
                    </div>

                    {/* Información del producto */}
                    <div className="flex flex-col flex-1 justify-between py-1 relative">
                      {/* Botón de favorito */}
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleToggleFavorite(plato)}
                        className={`absolute -top-2 -right-2 p-2 rounded-full shadow-md transition-all ${
                          isFavorite 
                            ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white" 
                            : "bg-white/80 text-gray-400 hover:text-pink-500"
                        }`}
                      >
                        <Heart 
                          size={14} 
                          className={isFavorite ? "fill-current" : ""}
                        />
                      </motion.button>

                      <div>
                        <h3 className="font-bold text-gray-800 leading-tight pr-6">
                          {plato.nombre}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {plato.descripcion}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <span className="text-xs text-gray-400 line-through">
                            {plato.precio > 10 ? `S/ ${(plato.precio * 1.2).toFixed(2)}` : ''}
                          </span>
                          <span className="font-extrabold text-orange-600 text-lg ml-1">
                            S/ {Number(plato.precio).toFixed(2)}
                          </span>
                        </div>

                        {cantidad === 0 ? (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleAddToCart(plato)}
                            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-2.5 rounded-full shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl"
                          >
                            <Plus size={18} className="stroke-[3]" />
                          </motion.button>
                        ) : (
                          <motion.div 
                            className="flex items-center bg-gray-100 rounded-full border-2 border-gray-200 shadow-sm"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                          >
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => cart.removeItem(plato.id, true)}
                              className="p-1.5 text-gray-600 hover:text-red-500 transition-colors"
                            >
                              <Minus size={14} className="stroke-[3]" />
                            </motion.button>
                            <motion.span 
                              className="w-8 text-center font-bold text-sm text-gray-800"
                              layout
                            >
                              {cantidad}
                            </motion.span>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleAddToCart(plato)}
                              className="p-1.5 text-orange-600 hover:text-orange-700 transition-colors"
                            >
                              <Plus size={14} className="stroke-[3]" />
                            </motion.button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.main>

        {/* Carrito Flotante Mejorado */}
        <AnimatePresence>
          {cart.getTotalItems() > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-6 left-4 right-4 z-40 max-w-md mx-auto"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => isStoreClosed 
                  ? showToast("El local está cerrado en este momento.", "error")
                  : setIsCheckoutOpen(true)
                }
                className="w-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 shadow-2xl shadow-orange-500/40 text-white rounded-2xl py-4 px-6 flex items-center justify-between transition-all relative overflow-hidden"
              >
                {/* Efecto de brillo */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
                
                <div className="flex items-center gap-3 relative z-10">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-2.5 relative">
                    <ShoppingCart size={22} />
                    <motion.span 
                      className="absolute -top-2 -right-2 bg-white text-orange-600 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      {cart.getTotalItems()}
                    </motion.span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Ver Mi Pedido</p>
                    <p className="text-xs text-orange-100">
                      {cart.getTotalItems()} {cart.getTotalItems() === 1 ? 'producto' : 'productos'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 relative z-10">
                  <span className="font-extrabold text-xl">
                    S/ {cart.getTotal().toFixed(2)}
                  </span>
                  <ChevronRight size={20} />
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
        />
      </div>
    </>
  );
}