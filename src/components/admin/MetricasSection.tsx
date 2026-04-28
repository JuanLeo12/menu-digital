"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Pedido = {
  id: string;
  total: number;
  estado: string;
  created_at?: string;
  tipo_pedido?: string;
  detalle?: { cantidad: number; nombre: string }[];
};

interface MetricasSectionProps {
  pedidos: Pedido[];
}

export default function MetricasSection({ pedidos }: MetricasSectionProps) {
  const [dateRange, setDateRange] = useState<"hoy" | "7d" | "30d" | "todo">("30d");

  const rangeInfo = useMemo(() => {
    if (dateRange === "todo") return null;

    const now = new Date();
    const start = new Date(now);

    if (dateRange === "hoy") {
      start.setHours(0, 0, 0, 0);
    } else if (dateRange === "7d") {
      start.setDate(now.getDate() - 7);
    } else {
      start.setDate(now.getDate() - 30);
    }

    return { start, end: now };
  }, [dateRange]);

  const pedidosFiltrados = useMemo(() => {
    if (!rangeInfo) return pedidos;

    return pedidos.filter((pedido) => {
      if (!pedido.created_at) return false;
      const fechaPedido = new Date(pedido.created_at);
      return fechaPedido >= rangeInfo.start && fechaPedido <= rangeInfo.end;
    });
  }, [pedidos, rangeInfo]);

  const pedidosPeriodoAnterior = useMemo(() => {
    if (!rangeInfo) return [];

    const durationMás = rangeInfo.end.getTime() - rangeInfo.start.getTime();
    const prevEnd = new Date(rangeInfo.start.getTime());
    const prevStart = new Date(prevEnd.getTime() - durationMás);

    return pedidos.filter((pedido) => {
      if (!pedido.created_at) return false;
      const fechaPedido = new Date(pedido.created_at);
      return fechaPedido >= prevStart && fechaPedido < prevEnd;
    });
  }, [pedidos, rangeInfo]);

  const pedidosCompletados = pedidosFiltrados.filter((p) => p.estado === "COMPLETADO");
  const totalVentas = pedidosCompletados.reduce(
    (acc, curr) => acc + Number(curr.total),
    0,
  );
  const ticketPromedio =
    pedidosCompletados.length > 0 ? totalVentas / pedidosCompletados.length : 0;

  const pedidosPendientes = pedidosFiltrados.filter((p) => p.estado === "PENDIENTE").length;
  const pedidosCancelados = pedidosFiltrados.filter((p) => p.estado === "CANCELADO").length;

  const pedidosPorTipo = pedidosFiltrados.reduce(
    (acc, pedido) => {
      const tipo = (pedido.tipo_pedido || "otro").toLowerCase();
      if (tipo === "delivery") acc.delivery += 1;
      else if (tipo === "recojo") acc.recojo += 1;
      else if (tipo === "salon") acc.salon += 1;
      else acc.otro += 1;
      return acc;
    },
    { delivery: 0, recojo: 0, salon: 0, otro: 0 },
  );
  const totalPedidos = pedidosFiltrados.length;
  const pedidosCompletadosPrev = pedidosPeriodoAnterior.filter(
    (p) => p.estado === "COMPLETADO",
  );
  const totalVentasPrev = pedidosCompletadosPrev.reduce(
    (acc, curr) => acc + Number(curr.total),
    0,
  );
  const ticketPromedioPrev =
    pedidosCompletadosPrev.length > 0
      ? totalVentasPrev / pedidosCompletadosPrev.length
      : 0;

  const getDelta = (current: number, previous: number) => {
    if (!rangeInfo) return null;
    if (previous === 0) {
      if (current === 0) return { direction: "neutral" as const, text: "Sin cambio vs periodo anterior" };
      return { direction: "up" as const, text: "Nuevo crecimiento vs periodo anterior" };
    }
    const pct = ((current - previous) / previous) * 100;
    const absPct = Math.abs(pct).toFixed(1);
    if (pct > 0) return { direction: "up" as const, text: `+${absPct}% vs periodo anterior` };
    if (pct < 0) return { direction: "down" as const, text: `-${absPct}% vs periodo anterior` };
    return { direction: "neutral" as const, text: "Sin cambio vs periodo anterior" };
  };

  const ventasDelta = getDelta(totalVentas, totalVentasPrev);
  const completadosDelta = getDelta(
    pedidosCompletados.length,
    pedidosCompletadosPrev.length,
  );
  const ticketDelta = getDelta(ticketPromedio, ticketPromedioPrev);

  const getDeltaClasses = (direction: "up" | "down" | "neutral") => {
    if (direction === "up") return "text-emerald-100";
    if (direction === "down") return "text-red-100";
    return "text-white";
  };

  const estadoSeries = [
    { label: "Completados", value: pedidosCompletados.length, fill: "#10b981" },
    { label: "Pendientes", value: pedidosPendientes, fill: "#f59e0b" },
    { label: "Cancelados", value: pedidosCancelados, fill: "#ef4444" },
  ];

  const tipoSeries = [
    { label: "Delivery", value: pedidosPorTipo.delivery, fill: "#3b82f6" },
    { label: "Recojo", value: pedidosPorTipo.recojo, fill: "#8b5cf6" },
    { label: "En local", value: pedidosPorTipo.salon, fill: "#f97316" },
  ];

  const estadoChartData = estadoSeries.map((item) => ({
    ...item,
    porcentaje: totalPedidos > 0 ? Number(((item.value / totalPedidos) * 100).toFixed(1)) : 0,
  }));
  const tipoChartData = tipoSeries.map((item) => ({
    ...item,
    porcentaje: totalPedidos > 0 ? Number(((item.value / totalPedidos) * 100).toFixed(1)) : 0,
  }));

  const topProductos = Object.entries(
    pedidosCompletados.reduce<Record<string, number>>((acc, pedido) => {
      (pedido.detalle || []).forEach((item) => {
        acc[item.nombre] = (acc[item.nombre] || 0) + Number(item.cantidad || 0);
      });
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="bg-zinc-900 border-zinc-800 rounded-3xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)] border-zinc-800">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-white">Dashboard de Ventas</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setDateRange("hoy")}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              dateRange === "hoy"
                ? "bg-slate-800 text-white border-gray-800"
                : "bg-zinc-900 border-zinc-800 text-white border-gray-200 hover:bg-black"
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setDateRange("7d")}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              dateRange === "7d"
                ? "bg-slate-800 text-white border-gray-800"
                : "bg-zinc-900 border-zinc-800 text-white border-gray-200 hover:bg-black"
            }`}
          >
            7 dias
          </button>
          <button
            onClick={() => setDateRange("30d")}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              dateRange === "30d"
                ? "bg-slate-800 text-white border-gray-800"
                : "bg-zinc-900 border-zinc-800 text-white border-gray-200 hover:bg-black"
            }`}
          >
            30 dias
          </button>
          <button
            onClick={() => setDateRange("todo")}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              dateRange === "todo"
                ? "bg-slate-800 text-white border-gray-800"
                : "bg-zinc-900 border-zinc-800 text-white border-gray-200 hover:bg-black"
            }`}
          >
            Todo
          </button>
        </div>
      </div>

      {totalPedidos === 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl p-3">
          No hay pedidos para el rango seleccionado.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-500 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200">
          <h3 className="text-emerald-100 font-medium mb-1">
            Ventas Totales Completadas
          </h3>
          <p className="text-4xl font-extrabold">S/ {totalVentas.toFixed(2)}</p>
          {ventasDelta && (
            <p className={`text-xs mt-2 ${getDeltaClasses(ventasDelta.direction)}`}>
              {ventasDelta.text}
            </p>
          )}
        </div>
        <div className="bg-blue-500 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
          <h3 className="text-blue-100 font-medium mb-1">Pedidos Completados</h3>
          <p className="text-4xl font-extrabold">{pedidosCompletados.length}</p>
          {completadosDelta && (
            <p className={`text-xs mt-2 ${getDeltaClasses(completadosDelta.direction)}`}>
              {completadosDelta.text}
            </p>
          )}
        </div>
        <div className="bg-violet-500 rounded-2xl p-6 text-white shadow-lg shadow-violet-200">
          <h3 className="text-violet-100 font-medium mb-1">Ticket Promedio</h3>
          <p className="text-4xl font-extrabold">S/ {ticketPromedio.toFixed(2)}</p>
          {ticketDelta && (
            <p className={`text-xs mt-2 ${getDeltaClasses(ticketDelta.direction)}`}>
              {ticketDelta.text}
            </p>
          )}
        </div>
      </div>
      <div className="mt-6 bg-black p-6 rounded-2xl border border-gray-100">
        <h3 className="font-bold text-white mb-4">Metricas de Pedidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex-1 bg-zinc-900 border-zinc-800 p-4 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.1)] border border-gray-100">
            <p className="text-sm text-white font-medium mb-1">
              En curso (Pendientes)
            </p>
            <p className="text-2xl font-bold text-amber-500">{pedidosPendientes}</p>
          </div>
          <div className="flex-1 bg-zinc-900 border-zinc-800 p-4 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.1)] border border-gray-100">
            <p className="text-sm text-white font-medium mb-1">Cancelados</p>
            <p className="text-2xl font-bold text-red-500">{pedidosCancelados}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border-zinc-800 p-5 rounded-2xl border-zinc-800 shadow-sm">
          <h3 className="font-bold text-white mb-3">Pedidos por Tipo</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between bg-black rounded-lg px-3 py-2">
              <span className="text-white">Delivery</span>
              <span className="font-bold text-white">{pedidosPorTipo.delivery}</span>
            </div>
            <div className="flex items-center justify-between bg-black rounded-lg px-3 py-2">
              <span className="text-white">Recojo</span>
              <span className="font-bold text-white">{pedidosPorTipo.recojo}</span>
            </div>
            <div className="flex items-center justify-between bg-black rounded-lg px-3 py-2">
              <span className="text-white">En local</span>
              <span className="font-bold text-white">{pedidosPorTipo.salon}</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border-zinc-800 p-5 rounded-2xl border-zinc-800 shadow-sm">
          <h3 className="font-bold text-white mb-3">Top Productos (completados)</h3>
          {topProductos.length === 0 ? (
            <p className="text-sm text-white">
              Aun no hay productos vendidos en pedidos completados.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              {topProductos.map(([nombre, cantidad]) => (
                <div
                  key={nombre}
                  className="flex items-center justify-between bg-black rounded-lg px-3 py-2"
                >
                  <span className="text-white truncate pr-3">{nombre}</span>
                  <span className="font-bold text-white">{cantidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border-zinc-800 p-5 rounded-2xl border-zinc-800 shadow-sm">
          <h3 className="font-bold text-white mb-4">Distribucion por Estado</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={estadoChartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={((value: any, _name: any, item: any) => [`${value ?? 0} pedidos (${item?.payload?.porcentaje ?? 0}%)`, "Cantidad"]) as any} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {estadoChartData.map((item) => (
                    <Cell key={item.label} fill={item.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 border-zinc-800 p-5 rounded-2xl border-zinc-800 shadow-sm">
          <h3 className="font-bold text-white mb-4">Distribucion por Canal</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tipoChartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={((value: any, _name: any, item: any) => [`${value ?? 0} pedidos (${item?.payload?.porcentaje ?? 0}%)`, "Cantidad"]) as any} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {tipoChartData.map((item) => (
                    <Cell key={item.label} fill={item.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {pedidosPorTipo.otro > 0 && (
        <div className="mt-4 text-xs text-white">
          Nota: {pedidosPorTipo.otro} pedido(s) tienen un tipo no estandar.
        </div>
      )}
    </div>
  );
}






