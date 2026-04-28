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
    <div className="bg-zinc-900 border-zinc-800 rounded-3xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)] border-zinc-800">
      <h2 className="text-xl font-bold text-white mb-6">Pedidos Recientes</h2>
      {pedidos.length === 0 ? (
        <div className="bg-zinc-800/80 border-2 border-dashed border-zinc-700 rounded-2xl p-10 text-center text-white">
          No tienes pedidos todavia.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pedidos.map((p) => (
            <div
              key={p.id}
              className={`p-5 rounded-2xl border ${
                p.estado === "PENDIENTE" ? "bg-amber-950/30 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)]" : 
                p.estado === "COMPLETADO" ? "bg-emerald-950/30 border-emerald-500/30" : 
                "bg-red-950/30 border-red-500/30"
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        p.estado === "PENDIENTE" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : 
                        p.estado === "COMPLETADO" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : 
                        "bg-red-500/20 text-red-300 border border-red-500/30"
                      }`}
                    >
                      {p.estado}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">
                      {new Date(p.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-lg mt-1 mb-0.5">
                    Cliente: {p.cliente_nombre}
                  </h3>
                  <p className="text-sm font-medium text-zinc-300 mb-3">
                    Total: <span className="text-orange-400 font-bold">S/ {Number(p.total).toFixed(2)}</span> - Tipo: <span className="text-zinc-100">{p.tipo_pedido}</span>
                  </p>
                  
                  <div className="text-sm text-zinc-400 bg-black/40 p-3 rounded-xl border border-white/5 space-y-1">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Detalle:</p>
                    <ul className="space-y-1.5">
                      {p.detalle.map((d, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="bg-orange-500/20 text-orange-400 text-[11px] font-bold px-1.5 py-0.5 rounded-md min-w-[24px] text-center">{d.cantidad}x</span> 
                          <span className="text-zinc-200">{d.nombre}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 md:h-max border-t border-white/5 pt-3 md:border-none md:pt-0 self-start w-full md:w-auto mt-2 md:mt-0">
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
                      className="bg-zinc-700 text-white p-2 rounded-lg hover:bg-zinc-600 transition-colors"
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






