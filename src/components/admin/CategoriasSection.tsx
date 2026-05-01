"use client";

import { Edit2, Plus, Search, Trash2, X } from "lucide-react";
import { useState } from "react";

type Categoria = { id: string; nombre: string; orden: number };

interface CategoriasSectionProps {
  categorias: Categoria[];
  onOpenCrearCategoria: () => void;
  onOpenEditarCategoria: (categoria: Categoria) => void;
  onBorrarCategoria: (id: string) => void;
}

export default function CategoriasSection({
  categorias,
  onOpenCrearCategoria,
  onOpenEditarCategoria,
  onBorrarCategoria,
}: CategoriasSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategorias = categorias.filter((c) =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-zinc-900 border-zinc-800 rounded-3xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)] border-zinc-800">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-white">Tus Categorías</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 transition-colors w-full sm:w-48"
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
            onClick={onOpenCrearCategoria}
            className="bg-emerald-500 text-white px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-emerald-600 active:scale-95 transition-all shadow-sm text-sm whitespace-nowrap"
          >
            <Plus size={18} />
            Nueva Categoría
          </button>
        </div>
      </div>

      {filteredCategorias.length === 0 ? (
        <div className="bg-zinc-800/50 border-2 border-dashed border-zinc-700 rounded-2xl p-10 text-center text-zinc-400">
          {searchTerm
            ? "No se encontraron categorías que coincidan con la búsqueda."
            : "Agrega categorías (Ej: Combos, Bebidas, Licores) para organizar tu menú."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategorias.map((c) => (
            <div
              key={c.id}
              className="flex flex-col p-4 rounded-xl bg-zinc-950 border-2 border-zinc-800 shadow-md gap-3"
            >
              <div className="w-full flex justify-between items-start">
                <h3 className="font-bold text-white text-lg pr-2 leading-tight">
                  {c.nombre}
                </h3>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-1 rounded font-bold shrink-0 tracking-widest uppercase border border-zinc-700">
                  Orden: {c.orden || "0"}
                </span>
              </div>
              <div className="flex items-center gap-2 w-full mt-2">
                <button
                  onClick={() => onOpenEditarCategoria(c)}
                  className="flex-1 flex justify-center items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white p-2.5 rounded-lg font-semibold transition-colors border border-zinc-700"
                >
                  <Edit2 size={16} />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => onBorrarCategoria(c.id)}
                  className="flex-1 flex justify-center items-center gap-2 bg-red-950/30 hover:bg-red-600 text-red-500 hover:text-white p-2.5 rounded-lg font-semibold transition-colors border border-red-900/50 hover:border-red-500"
                >
                  <Trash2 size={16} />
                  <span>Borrar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}











