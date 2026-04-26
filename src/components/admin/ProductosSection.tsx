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
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-700">Mis Productos</h2>
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
        <div className="space-y-4">
          {platos.map((p) => {
            const catNombre =
              categorias.find((c) => c.id === p.categoria_id)?.nombre ||
              "Sin categoria";
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
                    onClick={() => onOpenEditar(p)}
                    className="flex-1 sm:flex-none justify-center bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 p-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0 shadow-sm"
                  >
                    <Edit2 size={16} />{" "}
                    <span className="sm:hidden font-medium">Editar</span>
                  </button>
                  <button
                    onClick={() => onBorrarPlato(p.id)}
                    className="flex-1 sm:flex-none justify-center bg-white border border-slate-200 hover:bg-red-50 text-red-500 p-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0 shadow-sm"
                  >
                    <Trash2 size={16} />{" "}
                    <span className="sm:hidden font-medium">Borrar</span>
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
