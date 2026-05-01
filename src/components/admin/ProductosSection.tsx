"use client";

import { Edit2, GripVertical, Plus, Search, Trash2, X } from "lucide-react";
import { useState } from "react";

type Categoria = { id: string; nombre: string };

export type Plato = {
  id: string;
  nombre: string;
  precio: number;
  imagen_url: string;
  categoria_id: string;
  orden?: number;
};

interface ProductosSectionProps {
  platos: Plato[];
  categorias: Categoria[];
  onOpenCrear: () => void;
  onOpenEditar: (plato: Plato) => void;
  onBorrarPlato: (id: string) => void;
  onReorderPlatos: (platos: Plato[]) => void;
}

export default function ProductosSection({
  platos,
  categorias,
  onOpenCrear,
  onOpenEditar,
  onBorrarPlato,
  onReorderPlatos,
}: ProductosSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isDropping, setIsDropping] = useState(false);

  const filteredPlatos = platos.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const draggedIndex = platos.findIndex((p) => p.id === draggedId);
    const targetIndex = platos.findIndex((p) => p.id === targetId);

    const newPlatos = [...platos];
    const [removed] = newPlatos.splice(draggedIndex, 1);
    newPlatos.splice(targetIndex, 0, removed);

    // Update orden values
    const updatedPlatos = newPlatos.map((p, index) => ({
      ...p,
      orden: index,
    }));

    onReorderPlatos(updatedPlatos);
    setIsDropping(true);
    setTimeout(() => setIsDropping(false), 220);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-white">Mis Productos</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-orange-500 transition-colors w-full sm:w-48"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={onOpenCrear}
            className="bg-orange-500 text-white px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-orange-600 active:scale-95 transition-all shadow-sm text-sm whitespace-nowrap"
          >
            <Plus size={18} />
            Nuevo Producto
          </button>
        </div>
      </div>

      {filteredPlatos.length === 0 ? (
        <div className="bg-zinc-800/50 border-2 border-dashed border-zinc-700 rounded-2xl p-10 text-center text-zinc-400">
          {searchTerm
            ? "No se encontraron productos que coincidan con la búsqueda."
            : "Aún no tienes productos creados. Añade tu primer producto para que tus clientes puedan comprar."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlatos.map((p) => {
            const catNombre =
              categorias.find((c) => c.id === p.categoria_id)?.nombre ||
              "Sin categoria";
            const isDragging = draggedId === p.id;
            const isDragOver = dragOverId === p.id;

            return (
              <div
                key={p.id}
                draggable
                onDragStart={(e) => handleDragStart(e, p.id)}
                onDragOver={(e) => handleDragOver(e, p.id)}
                onDrop={(e) => handleDrop(e, p.id)}
                onDragEnd={handleDragEnd}
                className={`relative flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border-2 border-zinc-800 shadow-md gap-4 cursor-grab active:cursor-grabbing transition-all duration-200 will-change-transform ${
                  isDragging
                    ? "z-20 scale-110 -rotate-2 shadow-[0_14px_30px_rgba(249,115,22,0.35)] border-orange-400"
                    : "scale-100"
                } ${isDragOver ? "border-orange-500 scale-[1.02] bg-zinc-900" : ""} ${
                  isDropping ? "animate-pulse" : ""
                }`}
              >
                {isDragOver && !isDragging && (
                  <div className="absolute inset-0 rounded-xl border-2 border-dashed border-orange-400/70 pointer-events-none" />
                )}
                <div className="flex gap-3 items-center flex-1 min-w-0">
                  <div className="text-zinc-600 shrink-0">
                    <GripVertical size={16} />
                  </div>
                  {p.imagen_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imagen_url}
                      alt={p.nombre}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-zinc-800"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl shrink-0 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 text-xs font-bold">
                      Sin Img
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1 truncate self-start rounded">
                      {catNombre}
                    </p>
                    <h3 className="font-bold text-white text-[15px] truncate leading-tight">
                      {p.nombre}
                    </h3>
                    <p className="font-bold text-orange-400 text-sm mt-1">
                      S/ {(p.precio || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => onOpenEditar(p)}
                    className="flex justify-center items-center bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white p-2 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onBorrarPlato(p.id)}
                    className="flex justify-center items-center bg-red-950/40 border border-red-900/50 hover:bg-red-600 hover:border-red-500 text-red-500 hover:text-white p-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}






