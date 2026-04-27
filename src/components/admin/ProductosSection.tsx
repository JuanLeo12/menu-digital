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
    <div className="bg-zinc-900 border-zinc-800 rounded-3xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)] border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-700">Mis Productos</h2>
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
          Aun no tienes productos creados. Anade tu primer producto para que tus
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
                className="flex flex-col items-start p-4 rounded-2xl bg-black border border-gray-100 gap-3"
              >
                <div className="w-full">
                  <div className="flex items-center gap-3 mb-2">
                    {p.imagen_url ? (
                      // eslint-disable-next-line @next/next/no-img-eleMenút
                      <img
                        src={p.imagen_url}
                        alt={p.nombre}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gray-200"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl shrink-0 bg-slate-200 flex items-center justify-center text-gray-400 text-xs font-medium">
                        Sin Img
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-orange-500 mb-0.5 uppercase tracking-wider">
                        {catNombre}
                      </p>
                      <h3 className="font-bold text-gray-800 text-base leading-tight truncate">
                        {p.nombre}
                      </h3>
                    </div>
                  </div>
                  <p className="font-bold text-orange-600 text-lg">
                    S/ {(p.precio || 0).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full">
                  <button
                    onClick={() => onOpenEditar(p)}
                    className="flex-1 justify-center bg-zinc-900 border-zinc-800 border border-gray-200 hover:bg-slate-100 text-gray-700 p-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Edit2 size={16} />
                    <span className="font-medium">Editar</span>
                  </button>
                  <button
                    onClick={() => onBorrarPlato(p.id)}
                    className="flex-1 justify-center bg-zinc-900 border-zinc-800 border border-gray-200 hover:bg-red-50 text-red-500 p-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Trash2 size={16} />
                    <span className="font-medium">Borrar</span>
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



