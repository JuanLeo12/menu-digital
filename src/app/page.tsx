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
  Sparkles,
  MapPin,
  Phone,
  ArrowRight,
  ChevronDown,
  Award,
  TrendingUp,
  Users,
  Menu as MenuIcon,
  Camera,
  Globe
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useToast } from "@/components/Toast";
import CheckoutModal from "@/components/CheckoutModal";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

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
  const [activeTab, setActiveTab] = useState<"landing" | "menu" | "favorites">("landing");
  
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

  if (activeTab === "favorites") {
    platosPorCategoria = platosPorCategoria.filter(p => favorites.isFavorite(p.id));
  }

  const platosMostrados =
    busqueda.trim() === ""
      ? platosPorCategoria
      : platosPorCategoria.filter(
          (p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase())
        );

  // Productos populares (los primeros 6)
  const productosPopulares = platos.slice(0, 6);

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

  // Vista Landing Page
  if (activeTab === "landing") {
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
        
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 font-sans text-slate-900">
          {/* Hero Section */}
          <motion.header 
            className="relative h-[80vh] w-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
            <Image
              src="https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?q=80&w=1920&auto=format&fit=crop"
              alt="Portada Villa Granja"
              fill
              className="object-cover"
              priority
            />
            
            {/* Animated particles */}
            <div className="absolute inset-0 z-10 overflow-hidden">
              {particleData.map((particle, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 bg-yellow-400/60 rounded-full"
                  initial={{ 
                    x: `${particle.x}%`, 
                    y: `${particle.y}%`,
                    scale: 0 
                  }}
                  animate={{ 
                    y: [null, -30],
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

            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Sparkles className="w-8 h-8 text-yellow-400" />
                  </motion.div>
                  <span className="text-lg font-bold text-orange-300 uppercase tracking-widest">
                    El mejor sabor de la ciudad
                  </span>
                </div>
                <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-white mb-6">
                  Villa Granja 🍗
                </h1>
                <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto mb-8">
                  El auténtico sabor del pollo a la brasa, con el toque especial que nos caracteriza
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab("menu")}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl shadow-orange-500/50 flex items-center justify-center gap-2"
                  >
                    <UtensilsCrossed size={24} />
                    Ver Menú y Pedir
                  </motion.button>
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href="#info"
                    className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full font-bold text-lg border-2 border-white/50 flex items-center justify-center gap-2 hover:bg-white/30 transition-all"
                  >
                    <Info size={24} />
                    Más Información
                  </motion.a>
                </div>
              </motion.div>
            </div>

            <motion.div 
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChevronDown className="w-8 h-8 text-white/70" />
            </motion.div>
          </motion.header>

          {/* Sección de Información */}
          <section id="info" className="py-20 px-4 max-w-7xl mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4">
                ¿Por qué elegir <span className="text-orange-500">Villa Granja</span>?
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Más de 20 años brindando el mejor sabor a nuestras familias
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Award className="w-12 h-12" />,
                  title: "Calidad Premium",
                  desc: "Seleccionamos los mejores ingredientes para garantizar el sabor que nos caracteriza"
                },
                {
                  icon: <UtensilsCrossed className="w-12 h-12" />,
                  title: "Receta Única",
                  desc: "Nuestra marinada secreta y técnica de cocción nos hacen incomparables"
                },
                {
                  icon: <Users className="w-12 h-12" />,
                  title: "Atención Familiar",
                  desc: "Te atendemos como parte de nuestra familia, con calidez y dedicación"
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="bg-white rounded-3xl p-8 shadow-xl border border-orange-100 text-center hover:shadow-2xl transition-shadow"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                >
                  <div className="bg-gradient-to-br from-orange-100 to-amber-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-4">{item.title}</h3>
                  <p className="text-slate-600 text-lg">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Productos Populares */}
          <section className="py-20 px-4 bg-gradient-to-br from-orange-50/50 via-white to-amber-50/30">
            <div className="max-w-7xl mx-auto">
              <motion.div 
                className="text-center mb-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <TrendingUp className="w-8 h-8 text-orange-500" />
                  <span className="text-orange-500 font-bold uppercase tracking-widest">Los Más Pedidos</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4">
                  Nuestros Favoritos
                </h2>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                  Los platos que enamoran a nuestros clientes
                </p>
              </motion.div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {productosPopulares.map((plato, i) => (
                  <motion.div
                    key={plato.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-lg border border-orange-100 hover:shadow-2xl transition-all group"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="relative h-48 overflow-hidden">
                      {plato.imagen_url ? (
                        <Image
                          src={plato.imagen_url}
                          alt={plato.nombre}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <span className="text-gray-400">Sin imagen</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <motion.button
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleToggleFavorite(plato)}
                          className={`p-2 rounded-full shadow-lg ${
                            favorites.isFavorite(plato.id)
                              ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                              : "bg-white/90 text-gray-400 hover:text-pink-500"
                          }`}
                        >
                          <Heart size={18} className={favorites.isFavorite(plato.id) ? "fill-current" : ""} />
                        </motion.button>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-800 mb-2">{plato.nombre}</h3>
                      <p className="text-slate-600 mb-4 line-clamp-2">{plato.descripcion}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-extrabold text-orange-600">
                          S/ {plato.precio.toFixed(2)}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleAddToCart(plato)}
                          className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-3 rounded-full shadow-lg"
                        >
                          <Plus size={20} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="text-center mt-12">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab("menu")}
                  className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl flex items-center gap-2 mx-auto"
                >
                  Ver Menú Completo
                  <ArrowRight size={20} />
                </motion.button>
              </div>
            </div>
          </section>

          {/* Sección de Información y Contacto */}
          <section id="contacto" className="py-20 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-4xl font-extrabold mb-6">Visítanos</h2>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-orange-500/20 p-3 rounded-xl">
                        <MapPin className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">Dirección</h3>
                        <p className="text-slate-300">Av. Principal 123, Lima - Perú</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-orange-500/20 p-3 rounded-xl">
                        <Phone className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">Teléfono</h3>
                        <p className="text-slate-300">+51 999 999 999</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-orange-500/20 p-3 rounded-xl">
                        <Clock className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">Horario</h3>
                        <p className="text-slate-300">Lun - Dom: 12:00 PM - 10:00 PM</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex flex-col justify-center"
                >
                  <h2 className="text-4xl font-extrabold mb-6">Síguenos</h2>
                  <p className="text-slate-300 text-lg mb-8">
                    Mantente actualizado con nuestras promociones y novedades
                  </p>
                  <div className="flex gap-4">
                    <motion.a
                      whileHover={{ scale: 1.1, y: -5 }}
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-xl shadow-lg"
                    >
                      <Camera size={28} />
                    </motion.a>
                    <motion.a
                      whileHover={{ scale: 1.1, y: -5 }}
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg"
                    >
                      <Globe size={28} />
                    </motion.a>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-slate-950 text-slate-400 py-8 px-4 text-center">
            <p className="text-sm">
              © {new Date().getFullYear()} Villa Granja. Todos los derechos reservados.
            </p>
          </footer>

          {/* Botón Flotante para ir al Menú */}
          <motion.div
            className="fixed bottom-6 right-6 z-40"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: "spring" }}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveTab("menu")}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-full shadow-2xl"
            >
              <MenuIcon size={24} />
            </motion.button>
          </motion.div>
        </div>
      </>
    );
  }

  // Vista Menú (página actual)
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
        {/* Header */}
        <motion.header 
          className="relative h-48 w-full overflow-hidden"
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
          
          <div className="absolute z-20 bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
            <div className="flex items-center justify-between">
              <div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setActiveTab("landing")}
                  className="text-orange-300 hover:text-orange-200 flex items-center gap-2 mb-2"
                >
                  <ArrowRight className="rotate-180" size={16} />
                  Volver al inicio
                </motion.button>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  Villa Granja 🍗
                </h1>
                <p className="text-sm text-gray-200 flex items-center gap-2">
                  <Info size={14} /> 
                  Haz tu pedido aquí
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setActiveTab("landing")}
                className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
              >
                <Sparkles size={16} />
                Ver Información
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* Search Bar */}
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
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
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

        {/* Categorías */}
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

        {/* Título */}
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
          className="px-4 mt-4 max-w-6xl mx-auto"
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
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

                    <div className="flex flex-col flex-1 justify-between py-1 relative">
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
                className="w-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 shadow-2xl shadow-orange-500/40 text-white rounded-2xl py-4 px-6 flex items-center justify-between transition-all relative overflow-hidden"
              >
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