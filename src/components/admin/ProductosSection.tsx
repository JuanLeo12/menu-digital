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
                className="flex flex-col p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 relative overflow-hidden group shadow-md hover:shadow-orange-500/10 transition-all duration-300 gap-4"
              >
                {/* Decoration */}
                <div className="absolute top-0 right-0 p-12 bg-linear-to-bl from-orange-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="w-full relative z-10 flex gap-3 h-full">
                  {p.imagen_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imagen_url}
                      alt={p.nombre}
                      className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-zinc-700/50 shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl shrink-0 bg-zinc-800/50 border border-zinc-700/50 border-dashed flex flex-col items-center justify-center text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-xl mb-1 opacity-50">🍽️</span>
                      Sin Img
                    </div>
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-orange-400 bg-orange-500/10 self-start px-2 py-0.5 rounded-md mb-1.5 uppercase tracking-wider">
                      {catNombre}
                    </p>
                    <h3 className="font-bold text-white text-base leading-tight line-clamp-2 pr-4 group-hover:text-orange-50 transition-colors">
                      {p.nombre}
                    </h3>
                  </div>
                </div>
                
                <div className="flex items-center justify-between w-full relative z-10 mt-auto pt-3 border-t border-zinc-800">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Precio</span>
                    <span className="text-[15px] font-bold text-orange-400 bg-linear-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                      S/ {(p.precio || 0).toFixed(2)}
                    </span>
                  </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onOpenEditar(p)}
                    className="flex-1 justify-center bg-zinc-950 border border-zinc-700 hover:bg-zinc-800 hover:border-orange-500/30 text-white p-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm group-hover:text-orange-50"
                  >
                    <Edit2 size={16} className="text-zinc-300 group-hover:text-orange-300 transition-colors" />
                  </button>
                  <button
                    onClick={() => onBorrarPlato(p.id)}
                    className="justify-center bg-red-950/30 border border-red-900/50 hover:bg-red-600 hover:border-red-500 text-red-400 hover:text-white p-2.5 rounded-xl transition-all flex items-center shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}






