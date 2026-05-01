"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import PedidosSection from "@/components/admin/PedidosSection";
import MetricasSection from "@/components/admin/MetricasSection";
import CategoriasSection from "@/components/admin/CategoriasSection";
import ProductosSection from "@/components/admin/ProductosSection";
import ConfiguracionSection from "@/components/admin/ConfiguracionSection";
import {
  LogOut,
  CheckCircle2,
  Upload,
  UtensilsCrossed,
  ListOrdered,
  BarChart3,
  Settings,
  Tag,
} from "lucide-react";

type Categoria = { id: string; nombre: string; orden: number };
type Plato = {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  imagen_url: string;
  categoria_id: string;
  disponible?: boolean;
};

type HorarioDia = { abierto: boolean; abre: string; cierra: string };
type Configuración = {
  id: number;
  local_abierto: boolean;
  whatsapp_numero: string;
  yape_numero: string;
  yape_qr: string;
  plin_numero: string;
  plin_qr: string;
  auto_horario?: boolean;
  horarios?: { [key: string]: HorarioDia };
};
type Pedido = {
  id: string;
  cliente_nombre: string;
  tipo_pedido: string;
  total: number;
  estado: string;
  created_at: string;
  detalle: { cantidad: number; nombre: string }[];
};

const generateFileName = (ext: string | undefined) => {
  return `${Math.random().toString(36).substring(2)}-${Date.now()}.${ext}`;
};

export default function AdminPage() {
  const { showToast } = useToast();
  const supabase = createClient();
  const router = useRouter();

  const [configuracion, setConfiguración] = useState<Configuración | null>(
    null,
  );
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "platos" | "categorias" | "pedidos" | "metricas" | "configuracion"
  >("pedidos");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // States Formularios Platos
  const [formMode, setFormMode] = useState<"crear" | "editar" | null>(null);
  const [editPlatoId, setEditPlatoId] = useState<string>("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [imagen, setImagen] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categoria, setCategoria] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States Formularios Categorias
  const [formCatMode, setFormCatMode] = useState<"crear" | "editar" | null>(
    null,
  );
  const [editCatId, setEditCatId] = useState<string>("");
  const [catNombre, setCatNombre] = useState("");
  const [catOrden, setCatOrden] = useState<number | "">("");

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const respCat = await supabase
      .from("categorias")
      .select("*")
      .order("orden", { ascending: true })
      .order("nombre", { ascending: true });
    const respPlat = await supabase.from("platos").select("*");
    const respPeds = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false });

    const respConf = await supabase
      .from("configuracion")
      .select("*")
      .eq("id", 1)
      .single();

    if (respConf.data) {
      setConfiguración(respConf.data as Configuración);
    } else {
      // Si no existe la configuración, creamos una por defecto
      const defaultConf: Configuración = {
        id: 1,
        local_abierto: true,
        whatsapp_numero: "",
        yape_numero: "",
        yape_qr: "",
        plin_numero: "",
        plin_qr: "",
        auto_horario: false,
        horarios: {
          "1": { abierto: true, abre: "12:00", cierra: "23:00" },
          "2": { abierto: true, abre: "12:00", cierra: "23:00" },
          "3": { abierto: true, abre: "12:00", cierra: "23:00" },
          "4": { abierto: true, abre: "12:00", cierra: "23:00" },
          "5": { abierto: true, abre: "12:00", cierra: "23:59" },
          "6": { abierto: true, abre: "12:00", cierra: "23:59" },
          "0": { abierto: true, abre: "12:00", cierra: "22:00" },
        },
      };
      setConfiguración(defaultConf);
    }
    if (respCat.data) setCategorias(respCat.data);
    if (respPlat.data) setPlatos(respPlat.data);
    if (respPeds.data) setPedidos(respPeds.data);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      await fetchData();
    };
    init();

    // Actualizaciones en tiempo real - panel de admin
    const channel = supabase
      .channel("admin_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "schema_menu", table: "pedidos" },
        (payload) => {
          console.log("Cambio en pedidos:", payload);
          fetchData(false);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "schema_menu", table: "platos" },
        (payload) => {
          console.log("Cambio en platos:", payload);
          fetchData(false);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "schema_menu", table: "categorias" },
        (payload) => {
          console.log("Cambio en categorias:", payload);
          fetchData(false);
        },
      )
      .subscribe((status, err) => {
        console.log("Estado admin realtime:", status, err || "");
      });

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updatePedidoEstado = async (id: string, estado: string) => {
    setLoading(true);
    await supabase.from("pedidos").update({ estado }).eq("id", id);
    await fetchData();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  // --- CONFIGURACION ---
  const [confTemp, setConfTemp] = useState<Configuración | null>(null);
  const [yapeFile, setYapeFile] = useState<File | null>(null);
  const [plinFile, setPlinFile] = useState<File | null>(null);
  const yapeInputRef = useRef<HTMLInputElement>(null);
  const plinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    if (configuracion && !confTemp) {
      setTimeout(() => {
        if (mounted) setConfTemp(configuracion);
      }, 0);
    }
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configuracion]);

  const guardarConfiguración = async () => {
    if (!confTemp) return;
    setLoading(true);
    const payload = { ...confTemp };
    if (yapeFile) {
      const ext = yapeFile.name.split(".").pop();
      const fn = generateFileName(ext);
      await supabase.storage.from("platos").upload(fn, yapeFile);
      const urlInfo = supabase.storage.from("platos").getPublicUrl(fn);
      payload.yape_qr = urlInfo.data.publicUrl;
    }
    if (plinFile) {
      const ext = plinFile.name.split(".").pop();
      const fn = generateFileName(ext);
      await supabase.storage.from("platos").upload(fn, plinFile);
      const urlInfo = supabase.storage.from("platos").getPublicUrl(fn);
      payload.plin_qr = urlInfo.data.publicUrl;
    }
    const { error } = await supabase
      .from("configuracion")
      .upsert(payload, { onConflict: "id" })
      .eq("id", 1);
    if (error) showToast("Error guardando configuración: " + error.message);
    else showToast("¡Guardado correctaMenúte!");
    setYapeFile(null);
    setPlinFile(null);
    await fetchData();
  };

  // --- PLATOS ---
  const openCrear = () => {
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setImagen("");
    setImageFile(null);
    setCategoria(categorias[0]?.id || "");
    setFormMode("crear");
  };

  const openEditar = (p: Plato) => {
    setEditPlatoId(p.id);
    setNombre(p.nombre);
    setDescripcion(p.descripcion || "");
    setPrecio(p.precio.toString());
    setImagen(p.imagen_url || "");
    setImageFile(null);
    setCategoria(p.categoria_id);
    setFormMode("editar");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImagen(URL.createObjectURL(e.target.files[0])); // preview local
    }
  };

  const guardarPlato = async () => {
    if (!nombre || !precio || !categoria)
      return showToast("Completa los campos básicos");

    setLoading(true);
    let uploadedUrl = imagen;

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = generateFileName(fileExt);
      const { error: uploadError } = await supabase.storage
        .from("platos")
        .upload(fileName, imageFile);

      if (uploadError) {
        showToast("Error subiendo imagen: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("platos")
        .getPublicUrl(fileName);
      uploadedUrl = publicUrlData.publicUrl;
    }

    const payload = {
      nombre,
      descripcion,
      precio: parseFloat(precio),
      imagen_url: uploadedUrl || null,
      categoria_id: categoria,
      disponible: true,
    };

    if (formMode === "crear") {
      await supabase.from("platos").insert([payload]);
    } else {
      await supabase.from("platos").update(payload).eq("id", editPlatoId);
    }

    setFormMode(null);
    await fetchData();
  };

  const borrarPlato = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
    setLoading(true);
    await supabase.from("platos").delete().eq("id", id);
    await fetchData();
  };

  // --- CATEGORIAS ---
  const openCrearCategoria = () => {
    setCatNombre("");
    const defaultOrden =
      categorias.length > 0
        ? Math.max(...categorias.map((c) => c.orden || 0)) + 1
        : 1;
    setCatOrden(defaultOrden);
    setFormCatMode("crear");
  };

  const openEditarCategoria = (c: Categoria) => {
    setEditCatId(c.id);
    setCatNombre(c.nombre);
    setCatOrden(c.orden || 0);
    setFormCatMode("editar");
  };

  const guardarCategoria = async () => {
    if (!catNombre) return showToast("El nombre es obligatorio");
    setLoading(true);

    if (formCatMode === "crear") {
      const { error } = await supabase
        .from("categorias")
        .insert([{ nombre: catNombre, orden: catOrden === "" ? 0 : catOrden }]);
      if (error) {
        showToast("Error al crear categoría: " + error.message);
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("categorias")
        .update({ nombre: catNombre, orden: catOrden === "" ? 0 : catOrden })
        .eq("id", editCatId);
      if (error) {
        showToast("Error al actualizar categoría: " + error.message);
        setLoading(false);
        return;
      }
    }

    setFormCatMode(null);
    await fetchData();
  };

  const borrarCategoria = async (id: string) => {
    if (
      !confirm(
        "¿Seguro que deseas eliminar esta categoría? (Asegúrate de no tener productos Aquí)",
      )
    )
      return;
    setLoading(true);
    await supabase.from("categorias").delete().eq("id", id);
    await fetchData();
  };

  return (
    <div className="min-h-screen bg-black pb-24 font-sans text-white">
      {/* Header con gradiente */}
      <div className="bg-linear-to-r from-red-600 via-orange-600 to-yellow-600 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2 sm:gap-3">
                <img src="/logo.png" alt="Logo" className="h-10 w-auto sm:h-12" />
                Panel de Administración
              </h1>
              <p className="text-indigo-100 mt-1 sm:mt-2 text-sm sm:text-lg">Gestiona tu menú digital de forma moderna</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm border-4 border-black shadow-[0_0_10px_rgba(255,255,255,0.3)] w-auto sm:w-auto justify-center mx-auto sm:mx-0"
            >
              <LogOut size={14} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navegación principal - Desktop */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-4 relative z-10 hidden md:block">
        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
          <button
            onClick={() => setActiveTab("pedidos")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
              activeTab === "pedidos"
                ? "bg-linear-to-r from-red-600 to-orange-500 text-white shadow-blue-500/30 scale-105"
                : "bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
            }`}
          >
            <ListOrdered size={18} />
            Pedidos
            {pedidos.filter(p => p.estado === "PENDIENTE").length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === "pedidos" ? "bg-zinc-950/20" : "bg-blue-100 text-blue-600"
              }`}>
                {pedidos.filter(p => p.estado === "PENDIENTE").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("metricas")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
              activeTab === "metricas"
                ? "bg-linear-to-r from-orange-500 to-yellow-500 text-white shadow-purple-500/30 scale-105"
                : "bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
            }`}
          >
            <BarChart3 size={18} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("platos")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
              activeTab === "platos"
                ? "bg-linear-to-r from-orange-500 to-amber-500 text-white shadow-orange-500/30 scale-105"
                : "bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
            }`}
          >
            <UtensilsCrossed size={18} />
            Productos
          </button>
          <button
            onClick={() => setActiveTab("categorias")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
              activeTab === "categorias"
                ? "bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 scale-105"
                : "bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
            }`}
          >
            <Tag size={18} />
            Categorías
          </button>
          <button
            onClick={() => setActiveTab("configuracion")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
              activeTab === "configuracion"
                ? "bg-linear-to-r from-zinc-800 to-zinc-900 text-white shadow-slate-500/30 scale-105"
                : "bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
            }`}
          >
            <Settings size={18} />
            Configuración
          </button>
        </div>
      </div>

      {/* Botón hamburguesa - Mobile */}
      <div className="md:hidden max-w-7xl mx-auto px-4 -mt-4 relative z-20">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white shadow-lg"
        >
          <span className="font-semibold">
            {activeTab === "pedidos" ? "📋 Pedidos" :
             activeTab === "metricas" ? "📊 Dashboard" :
             activeTab === "platos" ? "🍽️ Productos" :
             activeTab === "categorias" ? "🏷️ Categorías" :
             "⚙️ Configuración"}
          </span>
          <div className="flex flex-col gap-1.5">
            <span className={`w-6 h-0.5 bg-white transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-white transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-white transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </div>
        </button>
      </div>

      {/* Menú desplegable - Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden max-w-7xl mx-auto px-4 relative z-10 -mt-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-b-2xl shadow-xl p-4 space-y-2">
            <button
              onClick={() => { setActiveTab("pedidos"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === "pedidos"
                  ? "bg-linear-to-r from-red-600 to-orange-500 text-white"
                  : "text-white hover:bg-zinc-800"
              }`}
            >
              <ListOrdered size={18} />
              <span>Pedidos</span>
              {pedidos.filter(p => p.estado === "PENDIENTE").length > 0 && (
                <span className="ml-auto bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs">
                  {pedidos.filter(p => p.estado === "PENDIENTE").length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab("metricas"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === "metricas"
                  ? "bg-linear-to-r from-orange-500 to-yellow-500 text-white"
                  : "text-white hover:bg-zinc-800"
              }`}
            >
              <BarChart3 size={18} />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => { setActiveTab("platos"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === "platos"
                  ? "bg-linear-to-r from-orange-500 to-amber-500 text-white"
                  : "text-white hover:bg-zinc-800"
              }`}
            >
              <UtensilsCrossed size={18} />
              <span>Productos</span>
            </button>
            <button
              onClick={() => { setActiveTab("categorias"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === "categorias"
                  ? "bg-linear-to-r from-emerald-500 to-teal-500 text-white"
                  : "text-white hover:bg-zinc-800"
              }`}
            >
              <Tag size={18} />
              <span>Categorías</span>
            </button>
            <button
              onClick={() => { setActiveTab("configuracion"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === "configuracion"
                  ? "bg-linear-to-r from-zinc-800 to-zinc-900 text-white"
                  : "text-white hover:bg-zinc-800"
              }`}
            >
              <Settings size={18} />
              <span>Configuración</span>
            </button>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        {loading && !formMode && !formCatMode ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
              <p className="text-slate-500 font-medium">Cargando datos...</p>
            </div>
          </div>
        ) : (
          <>
          {activeTab === "platos" && (
            <ProductosSection
              platos={platos}
              categorias={categorias}
              onOpenCrear={openCrear}
              onOpenEditar={openEditar}
              onBorrarPlato={borrarPlato}
            />
          )}

          {activeTab === "categorias" && (
            <CategoriasSection
              categorias={categorias}
              onOpenCrearCategoria={openCrearCategoria}
              onOpenEditarCategoria={openEditarCategoria}
              onBorrarCategoria={borrarCategoria}
            />
          )}

          {activeTab === "pedidos" && (
            <PedidosSection
              pedidos={pedidos}
              onUpdatePedidoEstado={updatePedidoEstado}
            />
          )}

          {activeTab === "configuracion" && confTemp && (
            <ConfiguracionSection
              confTemp={confTemp}
              onSetConfTemp={setConfTemp}
              onGuardarConfiguración={guardarConfiguración}
              yapeFile={yapeFile}
              plinFile={plinFile}
              onSetYapeFile={setYapeFile}
              onSetPlinFile={setPlinFile}
              yapeInputRef={yapeInputRef}
              plinInputRef={plinInputRef}
            />
          )}

            {activeTab === "metricas" && <MetricasSection pedidos={pedidos} />}
          </>
        )}
      </main>

      {/* MODAL FORMULARIO PRODUCTOS */}
      {formMode && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-950 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-800 shrink-0">
              <h3 className="font-bold text-2xl text-white">
                {formMode === "crear"
                  ? "➕ Agregar Producto"
                  : "✏️ Editar Producto"}
              </h3>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
                  Nombre del producto *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-white font-medium placeholder-zinc-500"
                  placeholder="Ej: 1/4 de Pollo a la Brasa / Gaseosa"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
                  Precio (S/) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-white font-medium placeholder-zinc-500"
                  placeholder="Ej: 18.50"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
                  Categoría *
                </label>
                {categorias.length === 0 ? (
                  <p className="text-sm text-red-400 italic bg-red-900/20 p-2 rounded-lg border border-red-900/50">
                    Por favor crea una categoría primero.
                  </p>
                ) : (
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-white font-medium"
                  >
                    <option value="" disabled>
                      Selecciona una categoría...
                    </option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-white resize-none h-24 placeholder-zinc-500"
                  placeholder="Ej: Acompañado de papas fritas y ensalada fresca."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
                  Foto del Producto
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900 hover:border-orange-500 transition-all group bg-zinc-900/50"
                >
                  {imagen ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-zinc-700">
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagen}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-medium flex items-center gap-2">
                          <Upload size={16} /> Cambiar foto
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center">
                      <div className="bg-orange-900/30 p-3 rounded-full text-orange-500 mb-3">
                        <Upload size={24} />
                      </div>
                      <p className="text-sm font-medium text-zinc-300">
                        Haz clic para subir imagen
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        JPG, PNG o WEBP (Máx 5MB)
                      </p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800 shrink-0 flex items-center gap-3 bg-zinc-900 rounded-b-3xl">
              <button
                onClick={() => setFormMode(null)}
                className="flex-1 bg-zinc-800 text-zinc-300 font-semibold py-3.5 rounded-xl hover:bg-zinc-700 border border-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarPlato}
                disabled={loading}
                className="flex-1 bg-orange-600 text-white font-semibold py-3.5 rounded-xl hover:bg-orange-700 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                {loading ? "Guardando..." : "Guardar Info"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORMULARIO CATEGORIAS */}
      {formCatMode && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-950 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col">
            <div className="p-6 border-b border-zinc-800 shrink-0">
              <h3 className="font-bold text-2xl text-white">
                {formCatMode === "crear"
                  ? "➕ Nueva Categoría"
                  : "✏️ Editar Categoría"}
              </h3>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  value={catNombre}
                  onChange={(e) => setCatNombre(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-white font-medium placeholder-zinc-500"
                  placeholder="Ej: Carnes"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1.5 mt-4">
                  Orden
                </label>
                <input
                  type="number"
                  value={catOrden}
                  onChange={(e) => setCatOrden(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-white font-medium placeholder-zinc-500"
                  placeholder="Ej: 1"
                  min="0"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setFormCatMode(null)}
                  className="flex-1 bg-zinc-800 text-zinc-300 font-semibold py-3.5 rounded-xl hover:bg-zinc-700 border border-zinc-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarCategoria}
                  disabled={loading}
                  className="flex-1 bg-emerald-600 text-white font-semibold py-3.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}








