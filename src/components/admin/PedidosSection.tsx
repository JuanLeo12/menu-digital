"use client";

import { CheckCircle2, Undo2, X } from "lucide-react";

type PedidoDetalle = { cantidad: number; nombre: string };

type Pedido = {
  id: string;
  cliente_nombre: string;
  tipo_pedido: string;
  total: number;
  estado: string;
  created_at: string;
  detalle: PedidoDetalle[];
};

interface PedidosSectionProps {
  pedidos: Pedido[];
  onUpdatePedidoEstado: (id: string, estado: string) => void;
}

export default function PedidosSection({
  pedidos,
  onUpdatePedidoEstado,
}: PedidosSectionProps) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-700 mb-6">Pedidos Recientes</h2>
      {pedidos.length === 0 ? (
        <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl p-10 text-center text-blue-800">
          No tienes pedidos todavia.
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
                    Total: S/ {Number(p.total).toFixed(2)} - Tipo: {p.tipo_pedido}
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
                        onClick={() => onUpdatePedidoEstado(p.id, "COMPLETADO")}
                        className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition-colors"
                        title="Marcar Completado"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                      <button
                        onClick={() => onUpdatePedidoEstado(p.id, "CANCELADO")}
                        className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                        title="Cancelar"
                      >
                        <X size={18} />
                      </button>
                    </>
                  )}
                  {p.estado !== "PENDIENTE" && (
                    <button
                      onClick={() => onUpdatePedidoEstado(p.id, "PENDIENTE")}
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
  );
}
