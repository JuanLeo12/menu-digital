"use client";

import { Clock, Settings, Smartphone, Store, Wallet } from "lucide-react";
import { RefObject } from "react";

type HorarioDia = { abierto: boolean; abre: string; cierra: string };

type Configuración = {
  id: number;
  local_abierto: boolean;
  whatsapp_numero: string;
  yape_numero: string;
  yape_qr: string;
  plin_numero: string;
  plin_qr: string;
  auto_horario?: boolean;
  horarios?: { [key: string]: HorarioDia };
};

interface ConfiguracionSectionProps {
  confTemp: Configuración;
  onSetConfTemp: (value: Configuración) => void;
  onGuardarConfiguración: () => void;
  yapeFile: File | null;
  plinFile: File | null;
  onSetYapeFile: (file: File | null) => void;
  onSetPlinFile: (file: File | null) => void;
  yapeInputRef: RefObject<HTMLInputElement | null>;
  plinInputRef: RefObject<HTMLInputElement | null>;
}

export default function ConfiguracionSection({
  confTemp,
  onSetConfTemp,
  onGuardarConfiguración,
  yapeFile,
  plinFile,
  onSetYapeFile,
  onSetPlinFile,
  yapeInputRef,
  plinInputRef,
}: ConfiguracionSectionProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)] max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="text-orange-500" /> Configuración del Local
        </h2>
        <button
          onClick={onGuardarConfiguración}
          className="bg-orange-500 text-white px-5 py-2.5 rounded-full font-semibold"
        >
          Guardar Cambios
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-black p-4 rounded-xl border-zinc-800 flex justify-between items-center">
          <div className="flex gap-3 items-center">
            <Store
              size={24}
              className={confTemp.local_abierto ? "text-emerald-500" : "text-red-500"}
            />
            <div>
              <p className="font-bold text-white">Estado del Local</p>
              <p className="text-sm text-white">
                ¿Está abierto y recibiendo pedidos?
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              onSetConfTemp({
                ...confTemp,
                local_abierto: !confTemp.local_abierto,
              })
            }
            disabled={confTemp.auto_horario}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
              confTemp.local_abierto ? "bg-emerald-500" : "bg-slate-300"
            } ${confTemp.auto_horario ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-zinc-900 border-zinc-800 transition-transform shadow-sm ${
                confTemp.local_abierto ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="bg-black p-4 rounded-xl border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-3 items-center">
              <Clock
                size={24}
                className={confTemp.auto_horario ? "text-blue-500" : "text-white"}
              />
              <div>
                <p className="font-bold text-white">Horarios Automaticos</p>
                <p className="text-sm text-white">
                  {confTemp.auto_horario
                    ? "El local abre y cierra solo según el horario. (Deshabilita el botón manual)"
                    : "Abre y cierra la tienda automaticaMenúte por hora y dia."}
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                onSetConfTemp({
                  ...confTemp,
                  auto_horario: !confTemp.auto_horario,
                })
              }
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${confTemp.auto_horario ? "bg-blue-500" : "bg-slate-300"}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-zinc-900 border-zinc-800 transition-transform shadow-sm ${confTemp.auto_horario ? "translate-x-7" : "translate-x-1"}`}
              />
            </button>
          </div>

          {confTemp.auto_horario && (
            <div className="space-y-3 mt-4 border-t border-gray-200 pt-4">
              {[
                { id: "1", name: "Lunes" },
                { id: "2", name: "Martes" },
                { id: "3", name: "Miercoles" },
                { id: "4", name: "Jueves" },
                { id: "5", name: "Viernes" },
                { id: "6", name: "Sabado" },
                { id: "0", name: "Domingo" },
              ].map((dia) => (
                <div
                  key={dia.id}
                  className="flex items-center justify-between bg-zinc-900 border-zinc-800 p-3 rounded-lg border border-gray-100"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center w-1/3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confTemp.horarios?.[dia.id]?.abierto ?? false}
                        onChange={(e) => {
                          const newHorarios = { ...confTemp.horarios };
                          if (!newHorarios[dia.id]) {
                            newHorarios[dia.id] = {
                              abierto: true,
                              abre: "12:00",
                              cierra: "23:00",
                            };
                          }
                          newHorarios[dia.id].abierto = e.target.checked;
                          onSetConfTemp({
                            ...confTemp,
                            horarios: newHorarios,
                          });
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span
                        className={`font-semibold ${confTemp.horarios?.[dia.id]?.abierto ? "text-white" : "text-white"}`}
                      >
                        {dia.name}
                      </span>
                    </label>
                  </div>

                  {confTemp.horarios?.[dia.id]?.abierto ? (
                    <div className="flex gap-2 items-center w-2/3 justify-end text-sm">
                      <span className="text-white">De</span>
                      <input
                        type="time"
                        value={confTemp.horarios[dia.id].abre}
                        onChange={(e) => {
                          const newHorarios = { ...confTemp.horarios };
                          newHorarios[dia.id].abre = e.target.value;
                          onSetConfTemp({
                            ...confTemp,
                            horarios: newHorarios,
                          });
                        }}
                        className="p-1 border-zinc-800 rounded outline-none focus:border-blue-500"
                      />
                      <span className="text-white">a</span>
                      <input
                        type="time"
                        value={confTemp.horarios[dia.id].cierra}
                        onChange={(e) => {
                          const newHorarios = { ...confTemp.horarios };
                          newHorarios[dia.id].cierra = e.target.value;
                          onSetConfTemp({
                            ...confTemp,
                            horarios: newHorarios,
                          });
                        }}
                        className="p-1 border-zinc-800 rounded outline-none focus:border-blue-500"
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-white italic">Cerrado todo el dia</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-black p-4 rounded-xl border-zinc-800">
          <p className="font-bold text-white mb-2">
            <Smartphone size={18} className="inline mr-1" /> WhatsApp de recepcion
          </p>
          <input
            type="text"
            value={confTemp.whatsapp_numero || ""}
            onChange={(e) =>
              onSetConfTemp({
                ...confTemp,
                whatsapp_numero: e.target.value,
              })
            }
            className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-orange-500 transition-colors"
            placeholder="Ej: 51902246535"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-purple-950/30 p-4 rounded-xl border border-purple-500/30">
            <p className="font-bold text-purple-300 mb-2">
              <Wallet size={18} className="inline mr-1" /> Numero Yape
            </p>
            <input
              type="text"
              value={confTemp.yape_numero || ""}
              onChange={(e) =>
                onSetConfTemp({
                  ...confTemp,
                  yape_numero: e.target.value,
                })
              }
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-orange-500 transition-colors mb-2"
              placeholder="Ej: 999888777"
            />

            <p className="font-bold text-purple-300 mb-2 text-sm mt-4">Codigo QR</p>
            <input
              type="file"
              ref={yapeInputRef}
              className="hidden"
              onChange={(e) => onSetYapeFile(e.target.files?.[0] || null)}
            />
            <div
              onClick={() => yapeInputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-purple-500/50 p-4 rounded-lg bg-zinc-900 border-zinc-800 text-center"
            >
              {yapeFile ? (
                "QR Seleccionado"
              ) : confTemp.yape_qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={confTemp.yape_qr} alt="Yape QR" className="h-20 mx-auto" />
              ) : (
                "Clic para subir QR"
              )}
            </div>
          </div>

          <div className="bg-sky-950/30 p-4 rounded-xl border border-sky-500/30">
            <p className="font-bold text-sky-300 mb-2">
              <Wallet size={18} className="inline mr-1" /> Numero Plin
            </p>
            <input
              type="text"
              value={confTemp.plin_numero || ""}
              onChange={(e) =>
                onSetConfTemp({
                  ...confTemp,
                  plin_numero: e.target.value,
                })
              }
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white outline-none focus:border-orange-500 transition-colors mb-2"
              placeholder="Ej: 999888777"
            />

            <p className="font-bold text-sky-300 mb-2 text-sm mt-4">Codigo QR</p>
            <input
              type="file"
              ref={plinInputRef}
              className="hidden"
              onChange={(e) => onSetPlinFile(e.target.files?.[0] || null)}
            />
            <div
              onClick={() => plinInputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-sky-500/50 p-4 rounded-lg bg-zinc-900 border-zinc-800 text-center"
            >
              {plinFile ? (
                "QR Seleccionado"
              ) : confTemp.plin_qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={confTemp.plin_qr} alt="Plin QR" className="h-20 mx-auto" />
              ) : (
                "Clic para subir QR"
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







