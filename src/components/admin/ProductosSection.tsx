"use client";

import { Edit2, Plus, Trash2 } from "lucide-react";

type Categoria = { id: string; nombre: string };

type Plato = {
  id: string;
  nombre: string;
  precio: number;
  imagen_url: string;
  categoria_id: string;
};

interface ProductosSectionProps {
  platos: Plato[];
  categorias: Categoria[];
  onOpenCrear: () => void;
  onOpenEditar: (plato: Plato) => void;
  onBorrarPlato: (id: string) => void;
}

export default function ProductosSection({
  platos,
  categorias,
  onOpenCrear,
  onOpenEditar,
  onBorrarPlato,
}: ProductosSectionProps) {
  return (
    <div className="bg-zinc-900 border-zinc-800 rounded-3xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)] border-zinc-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Mis Productos</h2>
        <button
          onClick={onOpenCrear}
          className="bg-orange-500 text-white px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-orange-600 active:scale-95 transition-all shadow-sm text-sm"
        >
          <Plus size={18} />
          Nuevo Producto
        </button>
      </div>

      {platos.length === 0 ? (
        <div className="bg-orange-50 border-2 border-dashed border-orange-200 rounded-2xl p-10 text-center text-orange-800">
          Aún no tienes productos creados. Añade tu primer producto para que tus
          clientes puedan comprar.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {platos.map((p) => {
            const catNombre =
              categorias.find((c) => c.id === p.categoria_id)?.nombre ||
              "Sin categoria";
            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border-2 border-zinc-800 shadow-md gap-4"
              >
                <div className="flex gap-4 items-center flex-1 min-w-0">
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






