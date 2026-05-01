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
  const [activeTab, setActiveTab] = useState<"landing" | "menu" | "favorites">("landing");
  
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
        ? `💖 ${plato.nombre} agregado a favoritos` 
        : `💔 ${plato.nombre} eliminado de favoritos`,
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
  return (
    <>
      <>
        {isStoreClosed && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="bg-linear-to-r from-red-600 via-red-500 to-orange-500 text-white text-center py-4 font-bold sticky top-0 z-50 shadow-2xl"
          >
            <div className="flex items-center justify-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Clock className="w-6 h-6" />
              </motion.div>
              <span className="text-lg">⏳ Local cerrado por ahora. Vuelve pronto!</span>
            </div>
          </motion.div>
        )}
        
        <div className="min-h-screen bg-black text-white overflow-hidden">
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
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-50 pointer-events-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <button
                    onClick={() => window.location.href="/menu"}
                    className="group px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 rounded-full font-bold text-base sm:text-lg md:text-xl text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <UtensilsCrossed size={20} className="group-hover:rotate-12 transition-transform" />
                    <span>Ver Menú y Pedir</span>
                  </button>

                  <button
                    onClick={() => {
                      const el = document.getElementById("info"); if(el) el.scrollIntoView({behavior:"smooth"});
                    }}
                    className="group px-6 sm:px-8 py-3 sm:py-4 border-2 border-white/30 bg-black/40 backdrop-blur-md rounded-full font-bold text-base sm:text-lg md:text-xl text-white shadow-lg transition-all duration-300 hover:bg-white/20 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-3"
                  >
                    <Info size={20} />
                    <span>Más Información</span>
                  </button>
                </motion.div>
            </div>
          </motion.section>

          {/* Sección de Características - GLASSMORPHISM */}
          <section id="info" className="py-16 sm:py-24 md:py-32 px-4 relative">
            <div className="max-w-7xl mx-auto">
              <motion.div 
                className="text-center mb-12 sm:mb-16 md:mb-20"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-center mb-6"
                >
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36">
                    <Image 
                      src="/logo.png" 
                      alt="Logo El Pollo Bravo" 
                      fill
                      className="object-contain drop-shadow-2xl"
                    />
                  </div>
                </motion.div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                  ¿Por Qué Elegirnos?
                </h2>
                <p className="text-base sm:text-lg md:text-2xl text-gray-400 max-w-3xl mx-auto">
                  Más de 20 años creando experiencias culinarias inolvidables
                </p>
              </motion.div>

              <motion.div 
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {[
                  {
                    icon: <Award className="w-16 h-16" />,
                    gradient: "from-orange-500 to-amber-500",
                    title: "Calidad Premium",
                    desc: "Ingredientes seleccionados cuidadosamente para garantizar el sabor excepcional"
                  },
                  {
                    icon: <Zap className="w-16 h-16" />,
                    gradient: "from-yellow-500 to-orange-500",
                    title: "Receta única",
                    desc: "Nuestra marinada secreta y tcúnica de coccin nos hacen incomparables"
                  },
                  {
                    icon: <Shield className="w-16 h-16" />,
                    gradient: "from-green-500 to-emerald-500",
                    title: "100% Seguro",
                    desc: "Protocolos de higiene estrictos para tu tranquilidad y salud"
                  }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-orange-600 to-red-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative bg-linear-to-br from-gray-900 to-black border border-gray-800 rounded-3xl p-4 sm:p-6 md:p-10 h-full hover:border-gray-600 transition-colors duration-500">
                      <div className={`bg-linear-to-r ${item.gradient} w-24 h-24 rounded-2xl flex items-center justify-center mb-6 text-white shadow-2xl`}>
                        {item.icon}
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">{item.title}</h3>
                      <p className="text-base sm:text-lg text-gray-400">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Sección de Productos Populares - NEUMORPHISM */}
          <section className="py-32 px-4 relative bg-linear-to-b from-black via-gray-900 to-black">
            <div className="max-w-7xl mx-auto">
              <motion.div 
                className="text-center mb-20"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <TrendingUp className="w-8 h-8 text-orange-500" />
                  <span className="text-orange-500 font-bold uppercase tracking-widest text-lg">Los Más Pedidos</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-black mb-6 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                  Nuestros Favoritos
                </h2>
                <p className="text-2xl text-gray-400 max-w-2xl mx-auto">
                  Los platos que enamoran a miles de clientes
                </p>
              </motion.div>

              <motion.div 
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {productosPopulares.map((plato) => (
                  <motion.div
                    key={plato.id}
                    variants={itemVariants}
                    whileHover={{ 
                      y: -10,
                      scale: 1.02,
                      transition: { duration: 0.3 }
                    }}
                    className="group relative bg-linear-to-br from-gray-900 to-black border border-gray-800 rounded-3xl overflow-hidden hover:border-orange-500/50 transition-all duration-500"
                  >
                    <div className="absolute inset-0 bg-linear-to-br from-red-500/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative h-64 overflow-hidden">
                      {plato.imagen_url ? (
                        <Image
                          src={plato.imagen_url}
                          alt={plato.nombre}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                          <span className="text-gray-600 text-6xl">?</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />
                    </div>

                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-white mb-2">{plato.nombre}</h3>
                          <p className="text-gray-400 line-clamp-2">{plato.descripcion}</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.2, rotate: 15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleToggleFavorite(plato)}
                          className={`p-3 rounded-full transition-all ${
                            favorites.isFavorite(plato.id)
                              ? "bg-linear-to-r from-pink-500 to-rose-500 text-white"
                              : "bg-gray-800 text-gray-400 hover:text-pink-500"
                          }`}
                        >
                          <Heart size={20} className={favorites.isFavorite(plato.id) ? "fill-current" : ""} />
                        </motion.button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-3xl font-black bg-linear-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
                            S/ {plato.precio.toFixed(2)}
                          </span>
                        </div>
                          <div className="text-center text-xs text-gray-500 px-2 py-2 rounded-full bg-gray-800/50 font-semibold uppercase tracking-wider">
                            Solo visualización
                          </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div 
                className="text-center mt-16"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.href="/menu"}
                  className="group px-6 sm:px-12 py-4 sm:py-6 bg-linear-to-r from-red-600 via-orange-500 to-yellow-500 rounded-full font-bold text-base sm:text-lg md:text-xl text-white shadow-2xl flex items-center gap-4 mx-auto"
                >
                  Ver Menú Completo
                  <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                </motion.button>
              </motion.div>
            </div>
          </section>

          {/* Sección de Contacto - GLASSMORPHISM */}
          <section id="contacto" className="py-32 px-4 relative">
            <AnimatedGradientBg />
            <div className="max-w-7xl mx-auto relative z-10">
              <div className="grid md:grid-cols-2 gap-12">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10"
                >
                  <h2 className="text-4xl font-black mb-8 bg-linear-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
                    Visítanos
                  </h2>
                  <div className="space-y-6">
                    {[
                      { icon: <MapPin className="w-6 h-6" />, title: "Dirección", info: "Av. Principal 123, Lima - Per" },
                      { icon: <Phone className="w-6 h-6" />, title: "Teléfono", info: "+51 999 999 999" },
                      { icon: <Clock className="w-6 h-6" />, title: "Horario", info: "Lun - Dom: 12:00 PM - 10:00 PM" },
                      { icon: <Truck className="w-6 h-6" />, title: "Delivery", info: "Envíos a todo Lima Metropolitana" }
                    ].map((item, i) => (
                      <motion.div 
                        key={i}
                        className="flex items-center gap-4"
                        whileHover={{ x: 10 }}
                      >
                        <div className="bg-linear-to-r from-orange-500/20 to-pink-500/20 p-3 rounded-xl text-orange-500">
                          {item.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{item.title}</h3>
                          <p className="text-gray-400">{item.info}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 flex flex-col justify-center"
                >
                  <h2 className="text-4xl font-black mb-8 bg-linear-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
                    Síguenos
                  </h2>
                  <p className="text-xl text-gray-300 mb-8">
                    Mantente actualizado con nuestras promociones y novedades exclusivas
                  </p>
                  <div className="flex gap-4">
                    {[
                      { 
                        icon: <img src="https://cdn-icons-png.freepik.com/512/779/779093.png?ga=GA1.1.767872142.1777252202" alt="Instagram" className="w-8 h-8 object-contain" />, 
                        bg: "bg-white", 
                        href: "https://instagram.com" 
                      },
                      { 
                        icon: <img src="https://cdn-icons-png.freepik.com/512/13170/13170340.png?ga=GA1.1.767872142.1777252202" alt="Facebook" className="w-8 h-8 object-contain" />, 
                        bg: "bg-white", 
                        href: "https://facebook.com" 
                      },
                      { 
                        icon: <img src="https://cdn-icons-png.freepik.com/512/5968/5968830.png?ga=GA1.1.767872142.1777252202" alt="X / Twitter" className="w-8 h-8 object-contain" />, 
                        bg: "bg-white", 
                        href: "https://twitter.com" 
                      }
                    ].map((social, i) => (
                      <motion.a
                        key={i}
                        whileHover={{ scale: 1.1, y: -5 }}
                        whileTap={{ scale: 0.9 }}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${social.bg} p-3 rounded-2xl shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow`}
                      >
                        {social.icon}
                      </motion.a>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-black border-t border-gray-800 py-12 px-4">
            <div className="max-w-7xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <Image 
                    src="/logo.png" 
                    alt="Logo El Pollo Bravo" 
                    fill
                    className="object-contain"
                  />
                </div>
                <h3 className="text-3xl font-black bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent mb-4">
                  El Pollo Bravo 🍗
                </h3>
                <p className="text-gray-500 text-lg mb-6">
                  El auténtico sabor del pollo a la brasa
                </p>
                <p className="text-gray-600">
                   {new Date().getFullYear()} El Pollo Bravo. Todos los derechos reservados.
                </p>
              </motion.div>
            </div>
          </footer>
        </div>
      </>
    </>
  );
}