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
  ChevronDown,
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

// Variantes de animación avanzadas
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

// Componente de partículas de fondo
function FloatingParticles() {
  const [particles, setParticles] = useState<{id: number, x: number, y: number, size: number, duration: number, delay: number}[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticles(Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5
    })));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-linear-to-r from-orange-400/20 to-pink-400/20 blur-sm"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, 50, 0],
            opacity: [0, 0.5, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

// Componente de gradiente animado de fondo extendido
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const cart = useCartStore();
  const favorites = useFavoritesStore();
  const { showToast } = useToast();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Efecto de seguimiento del mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
        ? `❤️ ${plato.nombre} agregado a favoritos` 
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
    showToast(`🛒 ${plato.nombre} agregado al carrito`, "success");
  }, [cart, showToast]);

  // Vista Landing Page - DISEÑO ULTRA MODERNO
  if (activeTab === "landing") {
    return (
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
              <span className="text-lg">⚠️ Local cerrado por ahora. ¡Vuelve pronto!</span>
            </div>
          </motion.div>
        )}
        
        <div className="min-h-screen bg-black text-white overflow-hidden">
          {/* Hero Section - ULTRA MODERNO */}
          <motion.section 
            className="relative h-screen flex items-center justify-center"
            style={{ opacity: heroOpacity, scale: heroScale }}
          >
            <AnimatedGradientBg />
            <FloatingParticles />
            
            {/* Efecto de luz siguiendo el mouse */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(236, 72, 153, 0.15), transparent 40%)`
              }}
            />
            
            <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="flex items-center justify-center gap-3 mb-6">
                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity }
                    }}
                    className="bg-linear-to-r from-red-600 to-orange-500 p-3 rounded-full"
                  >
                    <Sparkles className="w-8 h-8 text-white" />
                  </motion.div>
                  <span className="text-2xl font-bold bg-linear-to-r from-red-500 to-yellow-400 bg-clip-text text-transparent uppercase tracking-widest">
                    El Mejor Sabor
                  </span>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="mb-8 flex justify-center relative w-64 h-64 md:w-80 md:h-80 mx-auto drop-shadow-[0_0_50px_rgba(239,68,68,0.6)]"
                >
                  <Image 
                    src="/imagen_principal.png" 
                    alt="Pollo a la Brasa" 
                    fill 
                    className="object-contain animate-float"
                    priority
                  />
                </motion.div>

                <motion.h1 
                  className="flex flex-col items-center gap-4 text-7xl md:text-9xl font-black mb-6 leading-tight"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
                >
                  <div className="relative w-48 h-48 md:w-64 md:h-64 mb-4">
                    <Image src="/logo.png" alt="Logo El Pollo Bravo" fill className="object-contain" priority />
                  </div>
                  <span className="bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                    El Pollo Bravo
                  </span>
                </motion.h1>

                <motion.p 
                  className="text-2xl md:text-3xl text-gray-300 mb-12 max-w-3xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  El auténtico sabor del pollo a la brasa, con el toque especial que nos hace únicos
                </motion.p>

                <motion.div 
                  className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  <motion.button
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 20px 40px rgba(236, 72, 153, 0.4)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab("menu")}
                    className="group relative px-10 py-5 bg-linear-to-r from-red-600 via-orange-500 to-yellow-400 rounded-full font-bold text-xl text-white shadow-2xl overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      <UtensilsCrossed size={24} />
                      Ver Menú y Pedir
                    </span>
                    <div className="absolute inset-0 bg-linear-to-r from-yellow-400 via-orange-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      document.getElementById('info')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-10 py-5 border-2 border-white/30 backdrop-blur-sm rounded-full font-bold text-xl hover:bg-white/10 transition-all"
                  >
                    <span className="flex items-center gap-3">
                      <Info size={24} />
                      Más Información
                    </span>
                  </motion.button>
                </motion.div>
              </motion.div>
            </div>

            <motion.div 
              className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="w-10 h-10 text-white/50" />
            </motion.div>
          </motion.section>

          {/* Sección de Características - GLASSMORPHISM */}
          <section id="info" className="py-32 px-4 relative">
            <div className="max-w-7xl mx-auto">
              <motion.div 
                className="text-center mb-20"
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
                >
                  <span className="text-6xl mb-4 block">🎯</span>
                </motion.div>
                <h2 className="text-5xl md:text-6xl font-black mb-6 bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                  ¿Por Qué Elegirnos?
                </h2>
                <p className="text-2xl text-gray-400 max-w-3xl mx-auto">
                  Más de 20 años creando experiencias culinarias inolvidables
                </p>
              </motion.div>

              <motion.div 
                className="grid md:grid-cols-3 gap-8"
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
                    title: "Receta Única",
                    desc: "Nuestra marinada secreta y técnica de cocción nos hacen incomparables"
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
                    <div className="relative bg-linear-to-br from-gray-900 to-black border border-gray-800 rounded-3xl p-10 h-full hover:border-gray-600 transition-colors duration-500">
                      <div className={`bg-linear-to-r ${item.gradient} w-24 h-24 rounded-2xl flex items-center justify-center mb-6 text-white shadow-2xl`}>
                        {item.icon}
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-4">{item.title}</h3>
                      <p className="text-xl text-gray-400">{item.desc}</p>
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
                          <span className="text-gray-600 text-6xl">🍽️</span>
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
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleAddToCart(plato)}
                          className="bg-linear-to-r from-red-500 to-yellow-500 text-white p-4 rounded-full shadow-lg hover:shadow-orange-500/50 transition-shadow"
                        >
                          <Plus size={24} />
                        </motion.button>
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
                  onClick={() => setActiveTab("menu")}
                  className="group px-12 py-6 bg-linear-to-r from-red-600 via-orange-500 to-yellow-500 rounded-full font-bold text-xl text-white shadow-2xl flex items-center gap-4 mx-auto"
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
                      { icon: <MapPin className="w-6 h-6" />, title: "Dirección", info: "Av. Principal 123, Lima - Perú" },
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
                      { imgUrl: "https://cdn-icons-png.freepik.com/512/15707/15707869.png?ga=GA1.1.767872142.1777252202", gradient: "from-pink-500 to-rose-500", href: "https://instagram.com" },
                      { imgUrl: "https://cdn-icons-png.freepik.com/512/15707/15707884.png?ga=GA1.1.767872142.1777252202", gradient: "from-blue-500 to-blue-600", href: "https://facebook.com" },
                      { icon: <X size={24} />, gradient: "from-gray-700 to-gray-900", href: "https://twitter.com" }
                    ].map((social, i) => (
                      <motion.a
                        key={i}
                        whileHover={{ scale: 1.1, y: -5 }}
                        whileTap={{ scale: 0.9 }}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`bg-linear-to-r ${social.gradient} p-4 rounded-xl shadow-lg flex items-center justify-center text-white`}
                      >
                        {social.imgUrl ? (
                          <div className="relative w-6 h-6">
                            <Image src={social.imgUrl} alt="social" fill className="object-contain filter invert" />
                          </div>
                        ) : (
                          social.icon
                        )}
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
                  <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                </div>
                <h3 className="text-3xl font-black bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent mb-4">
                  El Pollo Bravo 🐔
                </h3>
                <p className="text-gray-500 text-lg mb-6">
                  El auténtico sabor del pollo a la brasa
                </p>
                <p className="text-gray-600">
                  © {new Date().getFullYear()} El Pollo Bravo. Todos los derechos reservados.
                </p>
              </motion.div>
            </div>
          </footer>

          {/* Botón Flotante Menú */}
          <motion.div
            className="fixed bottom-8 right-8 z-40"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: "spring" }}
          >
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveTab("menu")}
              className="bg-linear-to-r from-red-600 via-orange-500 to-yellow-400 text-white p-5 rounded-full shadow-2xl"
            >
              <MenuIcon size={28} />
            </motion.button>
          </motion.div>
        </div>
      </>
    );
  }

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
            <span className="text-lg">⚠️ Local cerrado por ahora. ¡Vuelve pronto!</span>
          </div>
        </motion.div>
      )}
      
      <div className="min-h-screen bg-black text-white pb-32">
        {/* Header con gradiente */}
        <motion.header 
          className="relative h-64 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="absolute inset-0 bg-linear-to-br from-red-900 via-orange-900 to-yellow-900" />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />
          
          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="text-center flex flex-col items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setActiveTab("landing")}
                className="text-orange-400 hover:text-orange-300 flex items-center gap-2 mb-4 mx-auto"
              >
                <ArrowRight className="rotate-180" size={18} />
                Volver al Inicio
              </motion.button>
              
              <div className="relative w-24 h-24 mb-2">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
              </div>
              <h1 className="text-5xl md:text-6xl font-black bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                El Pollo Bravo 🐔
              </h1>
              <p className="text-xl text-gray-300 mt-2">Haz tu pedido aquí</p>
            </div>
          </div>
        </motion.header>

        {/* Search Bar */}
        <motion.div 
          className="px-4 py-8 -mt-8 relative z-20"
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
                {activeTab === "favorites" ? "💔" : "🍽️"}
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
                const itemEnCarrito = cart.items.find((i) => i.id === plato.id);
                const cantidad = itemEnCarrito?.cantidad || 0;
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
              className="fixed bottom-6 left-4 right-4 z-40 max-w-md mx-auto"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => isStoreClosed 
                  ? showToast("El local está cerrado en este momento.", "error")
                  : setIsCheckoutOpen(true)
                }
                className="w-full bg-linear-to-r from-red-600 via-orange-600 to-yellow-600 shadow-2xl shadow-red-500/40 text-white rounded-2xl py-5 px-6 flex items-center justify-between transition-all relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
                
                <div className="flex items-center gap-3 relative z-10">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 relative">
                    <ShoppingCart size={24} />
                    <motion.span 
                      className="absolute -top-2 -right-2 bg-linear-to-r from-red-500 to-yellow-500 text-white text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      {cart.getTotalItems()}
                    </motion.span>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">Ver Mi Pedido</p>
                    <p className="text-xs text-white/70">
                      {cart.getTotalItems()} {cart.getTotalItems() === 1 ? 'producto' : 'productos'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 relative z-10">
                  <span className="font-extrabold text-2xl">
                    S/ {cart.getTotal().toFixed(2)}
                  </span>
                  <ChevronRight size={24} />
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
