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
    <div className="bg-zinc-900 border-zinc-800 rounded-3xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)] border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-700">Tus Categorias</h2>
        <button
          onClick={onOpenCrearCategoria}
          className="bg-emerald-500 text-white px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-emerald-600 active:scale-95 transition-all shadow-sm text-sm"
        >
          <Plus size={18} />
          Nueva Categoria
        </button>
      </div>

      {categorias.length === 0 ? (
        <div className="bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-2xl p-10 text-center text-emerald-800">
          Agrega categorias (Ej: Combos, Bebidas, Licores) para organizar tu menu.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categorias.map((c) => (
            <div
              key={c.id}
              className="flex flex-col items-start p-4 rounded-2xl bg-zinc-900 border-zinc-800 border border-gray-200 shadow-sm gap-3"
            >
              <div className="w-full">
                <h3 className="font-bold text-gray-800 text-lg leading-tight truncate">
                  {c.nombre}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Orden: {c.orden || "N/A"}
                </p>
              </div>
              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={() => onOpenEditarCategoria(c)}
                  className="flex-1 justify-center bg-black border border-gray-200 hover:bg-slate-100 text-gray-700 p-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Edit2 size={16} />
                  <span className="font-medium">Editar</span>
                </button>
                <button
                  onClick={() => onBorrarCategoria(c.id)}
                  className="flex-1 justify-center bg-black border border-gray-200 hover:bg-red-50 text-red-500 p-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Trash2 size={16} />
                  <span className="font-medium">Borrar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



