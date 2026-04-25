"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  LogOut,
  CheckCircle2,
  Upload,
  Tag,
  UtensilsCrossed,
  ListOrdered,
  BarChart3,
  X,
  Undo2,
  Settings,
  Store,
  Smartphone,
  Wallet,
  Clock,
} from "lucide-react";

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

type HorarioDia = { abierto: boolean; abre: string; cierra: string };
type Configuracion = {
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
  const supabase = createClient();
  const router = useRouter();

  const [configuracion, setConfiguracion] = useState<Configuracion | null>(
    null,
  );
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "platos" | "categorias" | "pedidos" | "metricas" | "configuracion"
  >("pedidos");

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

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const respCat = await supabase
      .from("categorias")
      .select("*")
      .order("orden", { ascending: true });
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
      setConfiguracion(respConf.data as Configuracion);
    } else {
      // Si no existe la configuración, creamos una por defecto
      const defaultConf: Configuracion = {
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
      setConfiguracion(defaultConf);
    }
    if (respCat.data) setCategorias(respCat.data);
    if (respPlat.data) setPlatos(respPlat.data);
    if (respPeds.data) setPedidos(respPeds.data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const [confTemp, setConfTemp] = useState<Configuracion | null>(null);
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

  const guardarConfiguracion = async () => {
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
    if (error) alert("Error guardando configuracion: " + error.message);
    else alert("¡Guardado correctamente!");
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
      return alert("Completa los campos básicos");

    setLoading(true);
    let uploadedUrl = imagen;

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = generateFileName(fileExt);
      const { error: uploadError } = await supabase.storage
        .from("platos")
        .upload(fileName, imageFile);

      if (uploadError) {
        alert("Error subiendo imagen: " + uploadError.message);
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
    setFormCatMode("crear");
  };

  const openEditarCategoria = (c: Categoria) => {
    setEditCatId(c.id);
    setCatNombre(c.nombre);
    setFormCatMode("editar");
  };

  const guardarCategoria = async () => {
    if (!catNombre) return alert("El nombre es obligatorio");
    setLoading(true);

    if (formCatMode === "crear") {
      const orden =
        categorias.length > 0
          ? Math.max(...categorias.map((c) => c.orden || 0)) + 1
          : 1;
      const { error } = await supabase
        .from("categorias")
        .insert([{ nombre: catNombre, orden }]);
      if (error) {
        alert("Error al crear categoría: " + error.message);
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("categorias")
        .update({ nombre: catNombre })
        .eq("id", editCatId);
      if (error) {
        alert("Error al actualizar categoría: " + error.message);
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
        "¿Seguro que deseas eliminar esta categoría? (Asegúrate de no tener productos aquí)",
      )
    )
      return;
    setLoading(true);
    await supabase.from("categorias").delete().eq("id", id);
    await fetchData();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24 font-sans">
      <div className="flex items-center justify-between mt-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            Panel de Control
          </h1>
          <p className="text-slate-500 mt-1">Gestiona tu menú digital</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
        >
          <LogOut size={20} className="mb-1" />
          <span className="text-xs font-semibold">Salir</span>
        </button>
        <button
          onClick={() => setActiveTab("pedidos")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === "pedidos" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <ListOrdered size={16} />
          Pedidos
        </button>
        <button
          onClick={() => setActiveTab("metricas")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === "metricas" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <BarChart3 size={16} />
          Dashboard
        </button>
      </div>

      <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-xl w-max">
        <button
          onClick={() => setActiveTab("platos")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === "platos" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <UtensilsCrossed size={16} />
          Productos
        </button>
        <button
          onClick={() => setActiveTab("categorias")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === "categorias" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <Tag size={16} />
          Categorías
        </button>
        <button
          onClick={() => setActiveTab("configuracion")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === "configuracion" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <Settings size={16} />
          Configuración
        </button>
      </div>

      {loading && !formMode && !formCatMode ? (
        <div className="text-center py-20 text-slate-500 animate-pulse">
          Cargando base de datos...
        </div>
      ) : (
        <>
          {activeTab === "platos" && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-700">
                  Mis Productos
                </h2>
                <button
                  onClick={openCrear}
                  className="bg-orange-500 text-white px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-orange-600 active:scale-95 transition-all shadow-sm text-sm"
                >
                  <Plus size={18} />
                  Nuevo Producto
                </button>
              </div>

              {platos.length === 0 ? (
                <div className="bg-orange-50 border-2 border-dashed border-orange-200 rounded-2xl p-10 text-center text-orange-800">
                  Aún no tienes productos creados. Añade tu primer producto para
                  que tus clientes puedan comprar.
                </div>
              ) : (
                <div className="space-y-4">
                  {platos.map((p) => {
                    const catNombre =
                      categorias.find((c) => c.id === p.categoria_id)?.nombre ||
                      "Sin categoría";
                    return (
                      <div
                        key={p.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 gap-4"
                      >
                        <div className="flex items-center gap-4">
                          {p.imagen_url ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.imagen_url}
                                alt={p.nombre}
                                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
                              />
                            </>
                          ) : (
                            <div className="w-16 h-16 rounded-xl shrink-0 bg-slate-200 flex items-center justify-center text-slate-400 text-xs font-medium">
                              Sin Img
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-bold text-orange-500 mb-1 uppercase tracking-wider">
                              {catNombre}
                            </p>
                            <h3 className="font-bold text-slate-800 text-lg leading-tight">
                              {p.nombre}
                            </h3>
                            <p className="font-medium text-slate-600 mt-1">
                              S/ {(p.precio || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                          <button
                            onClick={() => openEditar(p)}
                            className="flex-1 sm:flex-none justify-center bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 p-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0 shadow-sm"
                          >
                            <Edit2 size={16} />{" "}
                            <span className="sm:hidden font-medium">
                              Editar
                            </span>
                          </button>
                          <button
                            onClick={() => borrarPlato(p.id)}
                            className="flex-1 sm:flex-none justify-center bg-white border border-slate-200 hover:bg-red-50 text-red-500 p-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0 shadow-sm"
                          >
                            <Trash2 size={16} />{" "}
                            <span className="sm:hidden font-medium">
                              Borrar
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "categorias" && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-700">
                  Tus Categorías
                </h2>
                <button
                  onClick={openCrearCategoria}
                  className="bg-emerald-500 text-white px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-emerald-600 active:scale-95 transition-all shadow-sm text-sm"
                >
                  <Plus size={18} />
                  Nueva Categoría
                </button>
              </div>

              {categorias.length === 0 ? (
                <div className="bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-2xl p-10 text-center text-emerald-800">
                  Agrega categorías (Ej: Combos, Bebidas, Licores) para
                  organizar tu menú.
                </div>
              ) : (
                <div className="space-y-3">
                  {categorias.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-sm gap-4"
                    >
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg leading-tight w-full truncate">
                          {c.nombre}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => openEditarCategoria(c)}
                          className="flex-1 sm:flex-none justify-center bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 p-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0"
                        >
                          <Edit2 size={16} />{" "}
                          <span className="sm:hidden font-medium">Editar</span>
                        </button>
                        <button
                          onClick={() => borrarCategoria(c.id)}
                          className="flex-1 sm:flex-none justify-center bg-slate-50 border border-slate-200 hover:bg-red-50 text-red-500 p-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0"
                        >
                          <Trash2 size={16} />{" "}
                          <span className="sm:hidden font-medium">Borrar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "pedidos" && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-700 mb-6">
                Pedidos Recientes
              </h2>
              {pedidos.length === 0 ? (
                <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl p-10 text-center text-blue-800">
                  No tienes pedidos todavía.
                </div>
              ) : (
                <div className="space-y-4">
                  {pedidos.map((p) => (
                    <div
                      key={p.id}
                      className={`p-4 rounded-xl border ${p.estado === "PENDIENTE" ? "bg-amber-50 border-amber-200" : p.estado === "COMPLETADO" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}
                    >
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.estado === "PENDIENTE" ? "bg-amber-100 text-amber-700" : p.estado === "COMPLETADO" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                            >
                              {p.estado}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              {new Date(p.created_at).toLocaleString()}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-800 text-lg">
                            Cliente: {p.cliente_nombre}
                          </h3>
                          <p className="text-sm font-medium text-slate-600">
                            Total: S/ {Number(p.total).toFixed(2)} - Tipo:{" "}
                            {p.tipo_pedido}
                          </p>
                          <div className="text-xs text-slate-500 mt-2">
                            <ul>
                              {p.detalle.map((d, i) => (
                                <li key={i}>
                                  • {d.cantidad}x {d.nombre}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0 h-max">
                          {p.estado === "PENDIENTE" && (
                            <>
                              <button
                                onClick={() =>
                                  updatePedidoEstado(p.id, "COMPLETADO")
                                }
                                className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition-colors"
                                title="Marcar Completado"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  updatePedidoEstado(p.id, "CANCELADO")
                                }
                                className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                                title="Cancelar"
                              >
                                <X size={18} />
                              </button>
                            </>
                          )}
                          {p.estado !== "PENDIENTE" && (
                            <button
                              onClick={() =>
                                updatePedidoEstado(p.id, "PENDIENTE")
                              }
                              className="bg-slate-200 text-slate-600 p-2 rounded-lg hover:bg-slate-300 transition-colors"
                              title="Deshacer y Marcar Pendiente"
                            >
                              <Undo2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "configuracion" && confTemp && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                  <Settings className="text-orange-500" /> Configuración del
                  Local
                </h2>
                <button
                  onClick={guardarConfiguracion}
                  className="bg-orange-500 text-white px-5 py-2.5 rounded-full font-semibold"
                >
                  Guardar Cambios
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <Store
                      size={24}
                      className={
                        confTemp.local_abierto
                          ? "text-emerald-500"
                          : "text-red-500"
                      }
                    />
                    <div>
                      <p className="font-bold text-slate-800">
                        Estado del Local
                      </p>
                      <p className="text-sm text-slate-500">
                        ¿Está abierto y recibiendo pedidos?
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setConfTemp({
                        ...confTemp,
                        local_abierto: !confTemp.local_abierto,
                      })
                    }
                    disabled={confTemp.auto_horario}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                      confTemp.local_abierto ? "bg-emerald-500" : "bg-slate-300"
                    } ${confTemp.auto_horario ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm ${
                        confTemp.local_abierto
                          ? "translate-x-7"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Horarios Automáticos */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-3 items-center">
                      <Clock
                        size={24}
                        className={
                          confTemp.auto_horario
                            ? "text-blue-500"
                            : "text-slate-400"
                        }
                      />
                      <div>
                        <p className="font-bold text-slate-800">
                          Horarios Automáticos
                        </p>
                        <p className="text-sm text-slate-500">
                          {confTemp.auto_horario
                            ? "El local abre y cierra solo según el horario. (Deshabilita el botón manual)"
                            : "Abre y cierra la tienda automáticamente por hora y día."}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setConfTemp({
                          ...confTemp,
                          auto_horario: !confTemp.auto_horario,
                        })
                      }
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${confTemp.auto_horario ? "bg-blue-500" : "bg-slate-300"}`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm ${confTemp.auto_horario ? "translate-x-7" : "translate-x-1"}`}
                      />
                    </button>
                  </div>

                  {confTemp.auto_horario && (
                    <div className="space-y-3 mt-4 border-t border-slate-200 pt-4">
                      {[
                        { id: "1", name: "Lunes" },
                        { id: "2", name: "Martes" },
                        { id: "3", name: "Miércoles" },
                        { id: "4", name: "Jueves" },
                        { id: "5", name: "Viernes" },
                        { id: "6", name: "Sábado" },
                        { id: "0", name: "Domingo" },
                      ].map((dia) => (
                        <div
                          key={dia.id}
                          className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center w-1/3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={
                                  confTemp.horarios?.[dia.id]?.abierto ?? false
                                }
                                onChange={(e) => {
                                  const newHorarios = { ...confTemp.horarios };
                                  if (!newHorarios[dia.id])
                                    newHorarios[dia.id] = {
                                      abierto: true,
                                      abre: "12:00",
                                      cierra: "23:00",
                                    };
                                  newHorarios[dia.id].abierto =
                                    e.target.checked;
                                  setConfTemp({
                                    ...confTemp,
                                    horarios: newHorarios,
                                  });
                                }}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span
                                className={`font-semibold ${confTemp.horarios?.[dia.id]?.abierto ? "text-slate-800" : "text-slate-400"}`}
                              >
                                {dia.name}
                              </span>
                            </label>
                          </div>

                          {confTemp.horarios?.[dia.id]?.abierto ? (
                            <div className="flex gap-2 items-center w-2/3 justify-end text-sm">
                              <span className="text-slate-500">De</span>
                              <input
                                type="time"
                                value={confTemp.horarios[dia.id].abre}
                                onChange={(e) => {
                                  const newHorarios = { ...confTemp.horarios };
                                  newHorarios[dia.id].abre = e.target.value;
                                  setConfTemp({
                                    ...confTemp,
                                    horarios: newHorarios,
                                  });
                                }}
                                className="p-1 border border-slate-200 rounded outline-none focus:border-blue-500"
                              />
                              <span className="text-slate-500">a</span>
                              <input
                                type="time"
                                value={confTemp.horarios[dia.id].cierra}
                                onChange={(e) => {
                                  const newHorarios = { ...confTemp.horarios };
                                  newHorarios[dia.id].cierra = e.target.value;
                                  setConfTemp({
                                    ...confTemp,
                                    horarios: newHorarios,
                                  });
                                }}
                                className="p-1 border border-slate-200 rounded outline-none focus:border-blue-500"
                              />
                            </div>
                          ) : (
                            <div className="text-sm text-slate-400 italic">
                              Cerrado todo el día
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-800 mb-2">
                    <Smartphone size={18} className="inline mr-1" /> WhatsApp de
                    recepción
                  </p>
                  <input
                    type="text"
                    value={confTemp.whatsapp_numero || ""}
                    onChange={(e) =>
                      setConfTemp({
                        ...confTemp,
                        whatsapp_numero: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded-lg"
                    placeholder="Ej: 51902246535"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <p className="font-bold text-purple-900 mb-2">
                      <Wallet size={18} className="inline mr-1" /> Número Yape
                    </p>
                    <input
                      type="text"
                      value={confTemp.yape_numero || ""}
                      onChange={(e) =>
                        setConfTemp({
                          ...confTemp,
                          yape_numero: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded-lg mb-2"
                      placeholder="Ej: 999888777"
                    />

                    <p className="font-bold text-purple-900 mb-2 text-sm mt-4">
                      Código QR
                    </p>
                    <input
                      type="file"
                      ref={yapeInputRef}
                      className="hidden"
                      onChange={(e) => setYapeFile(e.target.files?.[0] || null)}
                    />
                    <div
                      onClick={() => yapeInputRef.current?.click()}
                      className="cursor-pointer border-2 border-dashed border-purple-300 p-4 rounded-lg bg-white text-center"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {yapeFile ? (
                        "QR Seleccionado"
                      ) : confTemp.yape_qr ? (
                        <img
                          src={confTemp.yape_qr}
                          alt="Yape QR"
                          className="h-20 mx-auto"
                        />
                      ) : (
                        "Clic para subir QR"
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <p className="font-bold text-blue-900 mb-2">
                      <Wallet size={18} className="inline mr-1" /> Número Plin
                    </p>
                    <input
                      type="text"
                      value={confTemp.plin_numero || ""}
                      onChange={(e) =>
                        setConfTemp({
                          ...confTemp,
                          plin_numero: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded-lg mb-2"
                      placeholder="Ej: 999888777"
                    />

                    <p className="font-bold text-blue-900 mb-2 text-sm mt-4">
                      Código QR
                    </p>
                    <input
                      type="file"
                      ref={plinInputRef}
                      className="hidden"
                      onChange={(e) => setPlinFile(e.target.files?.[0] || null)}
                    />
                    <div
                      onClick={() => plinInputRef.current?.click()}
                      className="cursor-pointer border-2 border-dashed border-blue-300 p-4 rounded-lg bg-white text-center"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {plinFile ? (
                        "QR Seleccionado"
                      ) : confTemp.plin_qr ? (
                        <img
                          src={confTemp.plin_qr}
                          alt="Plin QR"
                          className="h-20 mx-auto"
                        />
                      ) : (
                        "Clic para subir QR"
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "metricas" && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-700 mb-6">
                Dashboard de Ventas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-500 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200">
                  <h3 className="text-emerald-100 font-medium mb-1">
                    Ventas Totales Completadas
                  </h3>
                  <p className="text-4xl font-extrabold">
                    S/{" "}
                    {pedidos
                      .filter((p) => p.estado === "COMPLETADO")
                      .reduce((acc, curr) => acc + Number(curr.total), 0)
                      .toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-500 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                  <h3 className="text-blue-100 font-medium mb-1">
                    Pedidos Completados
                  </h3>
                  <p className="text-4xl font-extrabold">
                    {pedidos.filter((p) => p.estado === "COMPLETADO").length}
                  </p>
                </div>
              </div>
              <div className="mt-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-4">
                  Métricas de Pedidos
                </h3>
                <div className="flex gap-4">
                  <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm text-slate-500 font-medium mb-1">
                      En curso (Pendientes)
                    </p>
                    <p className="text-2xl font-bold text-amber-500">
                      {pedidos.filter((p) => p.estado === "PENDIENTE").length}
                    </p>
                  </div>
                  <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm text-slate-500 font-medium mb-1">
                      Cancelados
                    </p>
                    <p className="text-2xl font-bold text-red-500">
                      {pedidos.filter((p) => p.estado === "CANCELADO").length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL FORMULARIO PRODUCTOS */}
      {formMode && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-2xl text-slate-800">
                {formMode === "crear"
                  ? "🚀 Agregar Producto"
                  : "✏️ Editar Producto"}
              </h3>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                  Nombre del producto *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-800 font-medium"
                  placeholder="Ej: 1/4 de Pollo a la Brasa / Gaseosa"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                  Precio (S/) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-800 font-medium"
                  placeholder="Ej: 18.50"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                  Categoría *
                </label>
                {categorias.length === 0 ? (
                  <p className="text-sm text-red-500 italic bg-red-50 p-2 rounded-lg">
                    Por favor crea una categoría primero.
                  </p>
                ) : (
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-800 font-medium"
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
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-slate-800 resize-none h-24"
                  placeholder="Ej: Acompañado de papas fritas y ensalada fresca."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                  Foto del Producto
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-orange-400 transition-all group bg-slate-50/50"
                >
                  {imagen ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200">
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
                      <div className="bg-orange-100 p-3 rounded-full text-orange-500 mb-3">
                        <Upload size={24} />
                      </div>
                      <p className="text-sm font-medium text-slate-700">
                        Haz clic para subir imagen
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
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

            <div className="p-6 border-t border-slate-100 shrink-0 flex items-center gap-3 bg-slate-50 rounded-b-3xl">
              <button
                onClick={() => setFormMode(null)}
                className="flex-1 bg-white text-slate-600 font-semibold py-3.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors"
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
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-2xl text-slate-800">
                {formCatMode === "crear"
                  ? "🏷️ Nueva Categoría"
                  : "✏️ Editar Categoría"}
              </h3>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  value={catNombre}
                  onChange={(e) => setCatNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-800 font-medium"
                  placeholder="Ej: Carnes"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setFormCatMode(null)}
                  className="flex-1 bg-slate-100 text-slate-600 font-semibold py-3.5 rounded-xl hover:bg-slate-200 transition-colors"
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
