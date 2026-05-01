"use client";

import { Edit2, GripVertical, Plus, Search, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";

type Categoria = { id: string; nombre: string };

export type Plato = {
  id: string;
  nombre: string;
  precio: number;
  imagen_url: string;
  categoria_id: string;
  orden?: number;
};

interface ProductosSectionProps {
  platos: Plato[];
  categorias: Categoria[];
  onOpenCrear: () => void;
  onOpenEditar: (plato: Plato) => void;
  onBorrarPlato: (id: string) => void;
  onReorderPlatos: (platos: Plato[]) => void;
}

export default function ProductosSection({
  platos,
  categorias,
  onOpenCrear,
  onOpenEditar,
  onBorrarPlato,
  onReorderPlatos,
}: ProductosSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [orderedPlatos, setOrderedPlatos] = useState<Plato[]>(platos);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);

  const [touchDrag, setTouchDrag] = useState<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [touchGhostPlato, setTouchGhostPlato] = useState<Plato | null>(null);

  const orderedPlatosRef = useRef<Plato[]>(platos);
  const draggedIdRef = useRef<string | null>(null);
  const didCommitDragRef = useRef(false);
  const touchPointerIdRef = useRef<number | null>(null);
  const touchDragIdRef = useRef<string | null>(null);
  const touchStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchAnchorRef = useRef<HTMLDivElement | null>(null);
  const touchMetricsRef = useRef<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const applyOrder = (next: Plato[]) => {
    orderedPlatosRef.current = next;
    setOrderedPlatos(next);
  };

  const triggerHaptic = (ms = 12) => {
    if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
    navigator.vibrate(ms);
  };

  const playDropClick = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) audioContextRef.current = new AudioCtx();
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = 780;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.03, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch {
      // opcional
    }
  };

  const movePlato = (list: Plato[], fromId: string, toId: string) => {
    const fromIndex = list.findIndex((p) => p.id === fromId);
    const toIndex = list.findIndex((p) => p.id === toId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return list;
    const next = [...list];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
  };

  const commitOrder = (list: Plato[]) => {
    setIsCommitting(true);
    const payload = list.map((p, index) => ({ ...p, orden: index }));
    applyOrder(payload);
    onReorderPlatos(payload);
    triggerHaptic(18);
    playDropClick();
    setTimeout(() => setIsCommitting(false), 220);
  };

  const visiblePlatos = draggedId || touchDrag ? orderedPlatos : platos;
  const filteredPlatos = visiblePlatos.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const releaseTouchCapture = (pointerId: number) => {
    const node = touchAnchorRef.current;
    if (node?.releasePointerCapture) {
      try {
        if (node.hasPointerCapture(pointerId)) node.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
    }
    touchAnchorRef.current = null;
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    didCommitDragRef.current = false;
    draggedIdRef.current = id;
    applyOrder([...platos]);
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    const img = new Image();
    img.src =
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz4=";
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const from = draggedIdRef.current;
    if (!from || from === id) return;
    applyOrder(movePlato(orderedPlatosRef.current, from, id));
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const from = draggedIdRef.current;
    if (!from) return;
    let next = orderedPlatosRef.current;
    if (from !== targetId) {
      next = movePlato(next, from, targetId);
      applyOrder(next);
    }
    didCommitDragRef.current = true;
    commitOrder([...next]);
    draggedIdRef.current = null;
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    if (!didCommitDragRef.current) {
      applyOrder([...platos]);
    }
    didCommitDragRef.current = false;
    draggedIdRef.current = null;
    setDraggedId(null);
  };

  const getTargetIdFromPoint = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y);
    const card = el?.closest("[data-plato-id]") as HTMLElement | null;
    return card?.dataset.platoId || null;
  };

  const endTouchDrag = (pointerId: number) => {
    if (!touchDragIdRef.current) return;
    commitOrder([...orderedPlatosRef.current]);
    setTouchDrag(null);
    touchMetricsRef.current = null;
    setTouchGhostPlato(null);
    touchDragIdRef.current = null;
    touchPointerIdRef.current = null;
    setDraggedId(null);
    draggedIdRef.current = null;
    releaseTouchCapture(pointerId);
  };

  const cancelTouchDrag = (pointerId: number) => {
    if (touchStartTimerRef.current) {
      clearTimeout(touchStartTimerRef.current);
      touchStartTimerRef.current = null;
    }
    setTouchDrag(null);
    touchMetricsRef.current = null;
    setTouchGhostPlato(null);
    touchDragIdRef.current = null;
    touchPointerIdRef.current = null;
    setDraggedId(null);
    draggedIdRef.current = null;
    applyOrder([...platos]);
    releaseTouchCapture(pointerId);
  };

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    plato: Plato,
  ) => {
    if (e.pointerType !== "touch") return;
    touchPointerIdRef.current = e.pointerId;
    touchAnchorRef.current = e.currentTarget;
    const rect = e.currentTarget.getBoundingClientRect();

    if (touchStartTimerRef.current) clearTimeout(touchStartTimerRef.current);
    touchStartTimerRef.current = setTimeout(() => {
      const anchor = touchAnchorRef.current;
      if (!anchor) return;
      try {
        anchor.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      didCommitDragRef.current = false;
      draggedIdRef.current = plato.id;
      touchDragIdRef.current = plato.id;
      applyOrder([...platos]);
      setDraggedId(plato.id);
      setTouchGhostPlato(plato);
      triggerHaptic(10);
      const metrics = {
        id: plato.id,
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      };
      touchMetricsRef.current = metrics;
      setTouchDrag(metrics);
    }, 200);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") return;
    if (touchPointerIdRef.current !== e.pointerId) return;
    if (!touchDragIdRef.current) return;

    e.preventDefault();
    setTouchDrag((prev) => {
      const base = prev ?? touchMetricsRef.current;
      if (!base) return prev;
      const next = { ...base, x: e.clientX, y: e.clientY };
      touchMetricsRef.current = next;
      return next;
    });

    const targetId = getTargetIdFromPoint(e.clientX, e.clientY);
    const dragId = touchDragIdRef.current;
    if (!targetId || targetId === dragId) return;
    applyOrder(movePlato(orderedPlatosRef.current, dragId, targetId));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") return;
    if (touchStartTimerRef.current) {
      clearTimeout(touchStartTimerRef.current);
      touchStartTimerRef.current = null;
    }
    if (touchPointerIdRef.current !== e.pointerId) return;

    if (touchDragIdRef.current) {
      endTouchDrag(e.pointerId);
    } else {
      releaseTouchCapture(e.pointerId);
      touchPointerIdRef.current = null;
      touchAnchorRef.current = null;
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") return;
    if (touchStartTimerRef.current) {
      clearTimeout(touchStartTimerRef.current);
      touchStartTimerRef.current = null;
    }
    if (touchPointerIdRef.current === e.pointerId) {
      if (touchDrag) cancelTouchDrag(e.pointerId);
      else {
        releaseTouchCapture(e.pointerId);
        touchPointerIdRef.current = null;
      }
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-white">Mis Productos</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-orange-500 transition-colors w-full sm:w-48"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onOpenCrear}
            className="bg-orange-500 text-white px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:bg-orange-600 active:scale-95 transition-all shadow-sm text-sm whitespace-nowrap"
          >
            <Plus size={18} />
            Nuevo Producto
          </button>
        </div>
      </div>

      {filteredPlatos.length === 0 ? (
        <div className="bg-zinc-800/50 border-2 border-dashed border-zinc-700 rounded-2xl p-10 text-center text-zinc-400">
          {searchTerm
            ? "No se encontraron productos que coincidan con la búsqueda."
            : "Aún no tienes productos creados. Añade tu primer producto para que tus clientes puedan comprar."}
        </div>
      ) : (
        <div
          ref={listRef}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          style={{ touchAction: touchDrag ? "none" : "pan-y" }}
          onDragOver={handleContainerDragOver}
        >
          {filteredPlatos.map((p) => {
            const catNombre =
              categorias.find((c) => c.id === p.categoria_id)?.nombre ||
              "Sin categoria";
            const isDragging = draggedId === p.id;
            const isTouchDragging = touchDrag?.id === p.id;

            return (
              <div
                key={p.id}
                data-plato-id={p.id}
                draggable
                onDragStart={(e) => handleDragStart(e, p.id)}
                onDragOver={(e) => handleDragOver(e, p.id)}
                onDrop={(e) => handleDrop(e, p.id)}
                onDragEnd={handleDragEnd}
                onPointerDown={(e) => handlePointerDown(e, p)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                className={`relative flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border-2 border-zinc-800 shadow-md gap-4 cursor-grab active:cursor-grabbing transition-all duration-200 will-change-transform select-none ${
                  isDragging
                    ? "z-20 scale-[1.03] shadow-[0_14px_30px_rgba(249,115,22,0.35)] border-orange-400 ring-2 ring-orange-500/30"
                    : "scale-100"
                } ${isCommitting ? "animate-pulse" : ""} ${
                  isTouchDragging ? "opacity-25" : ""
                }`}
              >
                <div className="flex gap-3 items-center flex-1 min-w-0">
                  <div className="text-zinc-600 shrink-0">
                    <GripVertical size={16} />
                  </div>
                  {p.imagen_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imagen_url}
                      alt={p.nombre}
                      draggable={false}
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
                    type="button"
                    draggable={false}
                    onClick={() => onOpenEditar(p)}
                    className="flex justify-center items-center bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white p-2 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    draggable={false}
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

      {touchDrag && touchGhostPlato && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: touchDrag.x - touchDrag.offsetX,
            top: touchDrag.y - touchDrag.offsetY,
            width: touchDrag.width,
            height: touchDrag.height,
            transform: "scale(1.04) rotate(-1deg)",
          }}
        >
          <div className="h-full w-full rounded-xl border-2 border-orange-400 bg-zinc-900 shadow-[0_18px_45px_rgba(249,115,22,0.5)] ring-2 ring-orange-500/30 p-3.5 flex items-center justify-between gap-4">
            <div className="flex gap-3 items-center flex-1 min-w-0">
              <div className="text-zinc-500 shrink-0">
                <GripVertical size={16} />
              </div>
              {touchGhostPlato.imagen_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={touchGhostPlato.imagen_url}
                  alt={touchGhostPlato.nombre}
                  draggable={false}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-zinc-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl shrink-0 bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 text-xs font-bold">
                  Sin Img
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <h3 className="font-bold text-white text-[15px] truncate leading-tight">
                  {touchGhostPlato.nombre}
                </h3>
                <p className="font-bold text-orange-400 text-sm mt-1">
                  S/ {(touchGhostPlato.precio || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
