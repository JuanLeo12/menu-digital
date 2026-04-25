"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Plus, Minus, Search, Info } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
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

export default function Home() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [platos, setPlatos] = useState<Plato[]>([])
  const [isStoreClosed, setIsStoreClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const cart = useCartStore();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const fetchData = async () => {
      const respConf = await supabase.from("configuracion").select("*").eq("id", 1).single();
      if(respConf.data) {
        if (respConf.data.auto_horario && respConf.data.horarios) {
          // Evaluar horario automático
          const now = new Date();
          // Lima timezone if needed, or simple local time:
          const day = now.getDay().toString(); // 0-6 (0 is Sunday)
          const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
          
          const horarioDia = respConf.data.horarios[day];
          if (horarioDia && horarioDia.abierto) {
            // Verificar si la hora actual está entre abre y cierra
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

    // Actualizaciones en tiempo real - panel público
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
  const platosPorCategoria =
    categoriaActiva === "Todos"
      ? platos
      : platos.filter((p) => p.categoria_id === currentCatId);

  const platosMostrados =
    busqueda.trim() === ""
      ? platosPorCategoria
      : platosPorCategoria.filter(
          (p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase())
        );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-orange-500 font-medium">
        <div className="w-8 h-8 rounded-full border-4 border-orange-200 border-t-orange-600 animate-spin mr-3"></div>{" "}
        Cargando menú...
      </div>
    );

  return (    <>
      {isStoreClosed && (
        <div className="bg-red-500 text-white text-center py-3 font-semibold sticky top-0 z-50 shadow-md">
          ⚠️ Nuestro local se encuentra cerrado en este momento. Vuelve pronto.
        </div>
      )}    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-slate-900">
      <header className="relative h-48 w-full group">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?q=80&w=1200&auto=format&fit=crop"
          alt="Portada Pollería"
          fill
          className="object-cover"
        />
        <div className="absolute z-20 bottom-0 left-0 w-full p-4 bg-linear-to-t from-black/80 to-transparent text-white">
          <h1 className="text-2xl font-bold tracking-tight">Villa Granja 🍗</h1>
          <p className="text-sm opacity-90 flex items-center gap-1 mt-1">
            <Info size={14} /> Pide tu delivery o compra en salón
          </p>
        </div>
      </header>

      <div className="px-4 py-3 bg-white shadow-sm sticky top-0 z-30">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="¿Qué se te antoja hoy?"
            className="w-full bg-gray-100 rounded-full py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all border-none"
          />
        </div>
      </div>

      <div className="mt-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max pb-2">
          <button
            onClick={() => setCategoriaActiva("Todos")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${categoriaActiva === "Todos" ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
          >
            Todos
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaActiva(cat.nombre)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                categoriaActiva === cat.nombre
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      <main className="px-4 mt-6">
        <h2 className="text-lg font-bold mb-4 text-gray-800">
          {categoriaActiva}
        </h2>
        {platosMostrados.length === 0 ? (
          <div className="bg-white p-8 text-center text-gray-500 rounded-2xl border border-gray-100">
            No hay platos aún
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {platosMostrados.map((plato) => {
              const itemEnCarrito = cart.items.find((i) => i.id === plato.id);
              const cantidad = itemEnCarrito?.cantidad || 0;

              return (
                <div
                  key={plato.id}
                  className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex gap-4 relative overflow-hidden transition-all hover:shadow-md"
                >
                  <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    {plato.imagen_url ? (
                      <Image
                        src={plato.imagen_url}
                        alt={plato.nombre}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-gray-100">
                        Sin Img
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 justify-between py-1">
                    <div>
                      <h3 className="font-semibold text-gray-800 leading-tight pr-2">
                        {plato.nombre}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 pr-2 whitespace-pre-line">
                        {plato.descripcion}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-orange-600">
                        S/ {Number(plato.precio).toFixed(2)}
                      </span>

                      {cantidad === 0 ? (
                        <button
                          onClick={() =>
                            cart.addItem({
                              id: plato.id,
                              nombre: plato.nombre,
                              precio: plato.precio,
                            })
                          }
                          className="bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white p-2 rounded-full transition-colors"
                        >
                          <Plus size={16} className="stroke-3" />
                        </button>
                      ) : (
                        <div className="flex items-center bg-gray-100 rounded-full border border-gray-200">
                          <button
                            onClick={() => cart.removeItem(plato.id, true)}
                            className="p-1.5 text-gray-600 hover:text-black transition-colors"
                          >
                            <Minus size={14} className="stroke-3" />
                          </button>
                          <span className="w-6 text-center font-medium text-sm">
                            {cantidad}
                          </span>
                          <button
                            onClick={() =>
                              cart.addItem({
                                id: plato.id,
                                nombre: plato.nombre,
                                precio: plato.precio,
                              })
                            }
                            className="p-1.5 text-orange-600 hover:text-orange-700 transition-colors"
                          >
                            <Plus size={14} className="stroke-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <AnimatePresence>
        {cart.getTotalItems() > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-40 max-w-md mx-auto"
          >
            <button
              onClick={() => isStoreClosed ? alert("El local está cerrado en este momento.") : setIsCheckoutOpen(true)}
              className="w-full bg-orange-600 shadow-[0_8px_30px_rgb(234,88,12,0.3)] text-white rounded-2xl py-3.5 px-5 flex items-center justify-between transition-transform active:scale-95 border-none"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-2 relative">
                  <ShoppingCart size={20} />
                  <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm ring-2 ring-orange-600">
                    {cart.getTotalItems()}
                  </span>
                </div>
                <span className="font-semibold text-sm tracking-wide text-left">
                  Ver Mi Pedido
                </span>
              </div>
              <span className="font-bold text-lg">
                S/ {cart.getTotal().toFixed(2)}
              </span>
            </button>
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
