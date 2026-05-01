"use client";

import { Edit2, Plus, Trash2 } from "lucide-react";

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
  return (
    <div className="bg-zinc-900 border-zinc-800 rounded-3xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)] border-zinc-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Tus Categorias</h2>
        <button
          onClick={onOpenCrearCategoria}
          className="bg-emerald-500 text-white px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-emerald-600 active:scale-95 transition-all shadow-sm text-sm"
        >
          <Plus size={18} />
          Nueva Categoría
        </button>
      </div>

      {categorias.length === 0 ? (
        <div className="bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-2xl p-10 text-center text-emerald-800">
          Agrega categorías (Ej: Combos, Bebidas, Licores) para organizar tu menú.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categorias.map((c) => (
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











