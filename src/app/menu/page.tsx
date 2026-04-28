"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Search, 
  Info, 
  Heart,
  Clock,
  ChevronRight,
  UtensilsCrossed,
  Sparkles,
  ArrowRight,
    Award,
  TrendingUp,
  Menu as MenuIcon,
  Zap,
  Shield,
  Truck,
  Phone,
  MapPin,
  X
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

// Variantes de animacin avanzadas
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 120,
      damping: 15
    }
  }
};

function AnimatedGradientBg() {
  return (
    <div className="absolute inset-0 bg-background overflow-hidden z-[-1]">
      <motion.div
        className="absolute w-[60vw] h-[60vw] rounded-full blur-[120px] mix-blend-screen opacity-40 top-[-20%] left-[-10%]"
        animate={{
          background: [
            'radial-gradient(circle, rgba(168,85,247,0.8) 0%, transparent 70%)',
            'radial-gradient(circle, rgba(236,72,153,0.8) 0%, transparent 70%)',
            'radial-gradient(circle, rgba(59,130,246,0.8) 0%, transparent 70%)',
            'radial-gradient(circle, rgba(168,85,247,0.8) 0%, transparent 70%)'
          ]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute w-[50vw] h-[50vw] rounded-full blur-[120px] mix-blend-screen opacity-40 bottom-[-20%] right-[-10%]"
        animate={{
          background: [
            'radial-gradient(circle, rgba(59,130,246,0.8) 0%, transparent 70%)',
            'radial-gradient(circle, rgba(168,85,247,0.8) 0%, transparent 70%)',
            'radial-gradient(circle, rgba(236,72,153,0.8) 0%, transparent 70%)',
            'radial-gradient(circle, rgba(59,130,246,0.8) 0%, transparent 70%)'
          ]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 2 }}
      />
    </div>
  );
}

export default function Home() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [isStoreClosed, setIsStoreClosed] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [activeTab, setActiveTab] = useState<"menu" | "favorites">("menu");
  
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

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
        supabase.from("categorias").select("*").order("orden", { ascending: true }),
        supabase.from("platos").select("*").eq("disponible", true),
      ]);
      if (catsRes.data) setCategorias(catsRes.data);
      if (platosRes.data) setPlatos(platosRes.data);
    };
    fetchData();

    const channel = supabase
      .channel('public_realtime')
      .on('postgres_changes', { event: '*', schema: 'schema_menu', table: 'platos' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'schema_menu', table: 'categorias' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'schema_menu', table: 'configuracion' }, () => fetchData())
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

  if (activeTab === "favorites") {
    platosPorCategoria = platosPorCategoria.filter(p => favorites.isFavorite(p.id));
  }

  const platosMostrados =
    busqueda.trim() === ""
      ? platosPorCategoria
      : platosPorCategoria.filter(
          (p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase())
        );

  const productosPopulares = platos.slice(0, 6);

  const handleToggleFavorite = useCallback((plato: Plato) => {
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
        ? `? ${plato.nombre} agregado a favoritos` 
        : `? ${plato.nombre} eliminado de favoritos`,
      "info"
    );
  }, [favorites, showToast]);

  const handleAddToCart = useCallback((plato: Plato) => {
    cart.addItem({
      id: plato.id,
      nombre: plato.nombre,
      precio: plato.precio,
    });
    showToast(`? ${plato.nombre} agregado al carrito`, "success");
  }, [cart, showToast]);

  // Vista Landing Page - DISEÑO ULTRA MODERNO
  // Vista Menú - DISEÑO MODERNO
  return (
    <>
      {isStoreClosed && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="bg-linear-to-r from-red-600 via-red-500 to-orange-500 text-white text-center py-4 font-bold sticky top-0 z-50 shadow-2xl"
        >
          <div className="flex items-center justify-center gap-3">
            <Clock className="w-6 h-6" />
            <span className="text-lg">⏳ Local cerrado por ahora. Vuelve pronto!</span>
          </div>
        </motion.div>
      )}
      
      <div className="min-h-screen bg-black text-white pb-32">
          {/* Hero Section - BANNER IMAGEN COMPLETA */}
          <motion.section 
            className="relative w-full h-[50vh] md:h-[60vh] flex flex-col items-center justify-center p-4 overflow-hidden border-b border-white/5"
            style={{ opacity: heroOpacity, scale: heroScale }}
          >
            <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
               <Image 
                  src="/imagen_principal.png" 
                  alt="Fondo Principal El Pollo Bravo" 
                  fill 
                  className="object-cover object-center"
                  priority
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30 z-10" />
            </div>

            <div className="relative z-20 text-center flex flex-col items-center justify-center h-full w-full max-w-5xl mx-auto pt-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="flex items-center justify-center gap-3 mb-2"
                >
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
                  <span className="text-lg md:text-2xl font-bold text-yellow-400 uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    El Mejor Sabor
                  </span>
                </motion.div>

                <motion.h1 
                  className="text-5xl sm:text-6xl md:text-8xl font-black mb-4 text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.9)]"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.4, type: "spring" }}
                >
                  El Pollo Bravo
                </motion.h1>

                <motion.p 
                  className="text-base sm:text-lg md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] font-medium leading-relaxed px-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  El auténtico sabor del pollo a la brasa, con el toque especial que nos hace únicos.
                </motion.p>

                <motion.div 
                  className="flex justify-center items-center relative z-50 pointer-events-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <button
                    onClick={() => window.location.href="/inicio"}
                    className="group px-8 py-4 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 rounded-full font-bold text-xl text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <ArrowRight size={20} className="group-hover:-translate-x-1 rotate-180 transition-transform" />
                    <span>Volver al Inicio</span>
                  </button>
                </motion.div>
            </div>
          </motion.section>

        {/* Search Bar */}
        <motion.div 
          className="sticky top-2 z-50 px-4 py-4 w-full"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-linear-to-r from-red-600 via-orange-500 to-yellow-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-full shadow-2xl flex items-center p-2 border border-gray-700">
                <Search size={24} className="ml-4 text-gray-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="¿Qué se te antoja hoy?"
                  className="flex-1 bg-transparent px-6 py-4 text-lg outline-none text-white placeholder-gray-500"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda("")}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div 
          className="px-4 mb-8"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="max-w-md mx-auto">
            <div className="flex bg-gray-900/90 backdrop-blur-xl rounded-2xl p-2 border border-gray-800">
              {[
                { id: "menu", icon: <UtensilsCrossed size={18} />, label: "Menú" },
                { id: "favorites", icon: <Heart size={18} />, label: "Favoritos" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "menu" | "favorites")}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold transition-all ${
                    activeTab === tab.id
                      ? "bg-linear-to-r from-red-600 via-orange-500 to-yellow-400 text-white shadow-lg"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.id === "favorites" && favorites.favorites.length > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      activeTab === "favorites" 
                        ? "bg-white/20" 
                        : "bg-pink-500/20 text-pink-500"
                    }`}>
                      {favorites.favorites.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Categorías */}
        {activeTab === "menu" && (
          <motion.div 
            className="px-4 mb-8 overflow-x-auto"
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex gap-3 min-w-max pb-2 max-w-4xl mx-auto">
              {["Todos", ...categorias.map(c => c.nombre)].map((cat) => (
                <motion.button
                  key={cat}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCategoriaActiva(cat)}
                  className={`px-6 py-3 rounded-full font-bold transition-all ${
                    categoriaActiva === cat
                      ? "bg-linear-to-r from-red-600 via-orange-500 to-yellow-400 text-white shadow-lg shadow-red-500/30"
                      : "bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-600 hover:text-white"
                  }`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Grid de Productos */}
        <motion.main 
          className="px-4 max-w-7xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {platosMostrados.length === 0 ? (
            <motion.div 
              className="bg-gray-900/50 backdrop-blur-xl p-16 text-center rounded-3xl border border-gray-800"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="text-8xl mb-6">
                {activeTab === "favorites" ? "💔" : "❓"}
              </div>
              <p className="text-2xl font-bold text-white mb-4">
                {activeTab === "favorites" 
                  ? "No tienes favoritos aún" 
                  : "No hay platos en esta categoría"}
              </p>
              <p className="text-gray-400 text-lg">
                {activeTab === "favorites"
                  ? "Explora el menú y guarda tus platos favoritos"
                  : "Prueba con otra categoría"}
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {platosMostrados.map((plato) => {
                const itemCarrito = cart.items.find((i) => i.id === plato.id);
                const cantidad = itemCarrito?.cantidad || 0;
                const isFavorite = favorites.isFavorite(plato.id);

                return (
                  <motion.div
                    key={plato.id}
                    variants={itemVariants}
                    whileHover={{ y: -5, scale: 1.01 }}
                    className="group relative bg-gray-900/50 backdrop-blur-xl rounded-2xl p-4 border border-gray-800 hover:border-orange-500/50 transition-all duration-500 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-linear-to-br from-red-500/5 via-orange-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative flex gap-4">
                      <div className="relative w-32 h-32 shrink-0 rounded-xl overflow-hidden bg-gray-800 shadow-lg">
                        {plato.imagen_url ? (
                          <Image
                            src={plato.imagen_url}
                            alt={plato.nombre}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            Sin Img
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col flex-1 justify-between relative">
                        <motion.button
                          whileHover={{ scale: 1.2, rotate: 15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleToggleFavorite(plato)}
                          className={`absolute -top-2 -right-2 p-2 rounded-full shadow-lg transition-all ${
                            isFavorite 
                              ? "bg-linear-to-r from-pink-500 to-rose-500 text-white" 
                              : "bg-gray-800 text-gray-400 hover:text-pink-500"
                          }`}
                        >
                          <Heart size={16} className={isFavorite ? "fill-current" : ""} />
                        </motion.button>

                        <div>
                          <h3 className="font-bold text-lg text-white leading-tight">
                            {plato.nombre}
                          </h3>
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                            {plato.descripcion}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <span className="text-2xl font-black bg-linear-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
                            S/ {plato.precio.toFixed(2)}
                          </span>

                          {cantidad === 0 ? (
                            <motion.button
                              whileHover={{ scale: 1.1, rotate: 90 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleAddToCart(plato)}
                              className="bg-linear-to-r from-red-500 to-yellow-500 text-white p-3 rounded-full shadow-lg"
                            >
                              <Plus size={20} />
                            </motion.button>
                          ) : (
                            <motion.div 
                              className="flex items-center bg-gray-800 rounded-full border border-gray-700"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                            >
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => cart.removeItem(plato.id, true)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Minus size={16} />
                              </motion.button>
                              <span className="w-8 text-center font-bold text-white">
                                {cantidad}
                              </span>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleAddToCart(plato)}
                                className="p-2 text-orange-500 hover:text-orange-400 transition-colors"
                              >
                                <Plus size={16} />
                              </motion.button>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.main>

        {/* Carrito Flotante */}
        <AnimatePresence>
          {cart.getTotalItems() > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-6 right-6 md:right-8 z-40 w-auto"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => isStoreClosed 
                  ? showToast("El local está cerrado en este momento.", "error")
                  : setIsCheckoutOpen(true)
                }
                className="group relative bg-linear-to-r from-red-600 via-orange-500 to-yellow-500 shadow-[0_10px_35px_rgba(239,68,68,0.4)] rounded-full p-4 flex items-center justify-center gap-4 overflow-hidden border border-white/20 transition-all"
              >
                <div className="absolute inset-0 bg-white/20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10 flex items-center justify-center bg-black/20 p-3 rounded-full backdrop-blur-sm">
                  <div className="relative">
                    <ShoppingCart size={24} className="text-white" />
                    <motion.span 
                      key={cart.getTotalItems()}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-3 -right-3 bg-white text-red-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-black shadow-lg"
                    >
                      {cart.getTotalItems()}
                    </motion.span>
                  </div>
                </div>

                <div className="flex items-center gap-3 relative z-10 font-bold text-white pr-2">
                  <span className="hidden sm:block text-lg">Ver pedido</span>
                  <span className="font-extrabold text-xl bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                    S/ {cart.getTotal().toFixed(2)}
                  </span>
                  <ChevronRight size={20} className="hidden sm:block" />
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




