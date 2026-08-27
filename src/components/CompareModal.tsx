'use client';

import React from 'react';
import { CalculatedStation } from '@/lib/types/fuel';
import { Button, Chip } from '@heroui/react';
import { X, Sparkles, Navigation, CheckCircle2, Layers } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stations: CalculatedStation[];
  onRemoveStation: (id: string) => void;
  tankCapacity: number;
}

export default function CompareModal({
  isOpen,
  onClose,
  stations,
  onRemoveStation,
  tankCapacity,
}: Props) {
  if (!isOpen || stations.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="bg-white dark:bg-[#08090d] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl transition-colors">
        {/* Header */}
        <div className="border-b border-black/5 dark:border-white/5 p-6 flex items-center justify-between bg-slate-50/50 dark:bg-black/30">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0075FF] to-[#8000FF] p-0.5 flex items-center justify-center shadow-lg shadow-[#0075FF]/10">
              <div className="w-full h-full bg-white dark:bg-black rounded-[14px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-[#0075FF]" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Comparador de Precios</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                Comparativa de coste para llenar tu depósito de {tankCapacity} Litros
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full text-slate-400 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison grid */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className={`grid grid-cols-1 md:grid-cols-${Math.min(stations.length, 3)} gap-4`}>
            {stations.map((item, index) => {
              const isBest = index === 0;
              return (
                <div
                  key={item.station.id}
                  className={`p-6 rounded-3xl border flex flex-col justify-between relative transition-all ${
                    isBest
                      ? 'bg-gradient-to-b from-[#00D97E]/10 to-transparent border-[#00D97E]/40 shadow-xl shadow-[#00D97E]/5'
                      : 'bg-slate-50 dark:bg-black/50 border-slate-200 dark:border-white/10'
                  }`}
                >
                  <button
                    onClick={() => onRemoveStation(item.station.id)}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div>
                    {isBest && (
                      <span className="inline-block bg-[#00D97E] text-black font-black text-[10px] uppercase mb-3 px-2 py-0.5 rounded-full shadow-sm">
                        ⭐ Mejor Precio
                      </span>
                    )}

                    <div className="font-black text-xl text-slate-900 dark:text-white tracking-tight">{item.station.brand}</div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium line-clamp-1 mt-0.5">{item.station.name}</div>
                    <div className="text-[11px] text-slate-400 dark:text-zinc-500 line-clamp-1 mb-5">{item.station.address}</div>

                    {/* Breakdown */}
                    <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-black/80 border border-slate-200 dark:border-white/10 text-xs mb-4 shadow-sm">
                      <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
                        <span>Precio oficial:</span>
                        <span className="line-through">{item.officialPrice.toFixed(3)} €/L</span>
                      </div>

                      <div className="flex justify-between items-center text-[#00A860] dark:text-[#00D97E]">
                        <span>Descuento aplicado:</span>
                        <span className="font-bold">
                          {item.discountPerLiter > 0
                            ? `-${item.discountPerLiter.toFixed(3)} €/L`
                            : '0,000 €/L'}
                        </span>
                      </div>

                      {item.appliedDiscountName && (
                        <div className="text-[10px] text-slate-400 dark:text-zinc-500 italic">
                          ({item.appliedDiscountName})
                        </div>
                      )}

                      <div className="pt-2 border-t border-black/5 dark:border-white/10 flex justify-between items-center text-sm font-black text-slate-900 dark:text-white">
                        <span>Precio para ti:</span>
                        <span className="text-[#00A860] dark:text-[#00D97E] text-base">{item.finalPrice.toFixed(3)} €/L</span>
                      </div>
                    </div>

                    {/* Tank calculation */}
                    <div className="space-y-1.5 p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 text-xs mb-5">
                      <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                        <span>Coste depósito ({tankCapacity}L):</span>
                        <span className="font-bold text-slate-900 dark:text-white">{item.tankCostFinal.toFixed(2)} €</span>
                      </div>
                      {item.tankSaving > 0 && (
                        <div className="flex justify-between text-[#00A860] dark:text-[#00D97E] font-black text-xs">
                          <span>Ahorro total:</span>
                          <span>+{item.tankSaving.toFixed(2)} €</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-500 dark:text-zinc-500 text-[11px] pt-1">
                        <span>Distancia:</span>
                        <span>{item.distanceKm} km</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${item.station.latitude},${item.station.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-black text-xs py-3 rounded-full transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Navegar con GPS
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-black/5 dark:border-white/5 p-6 bg-slate-50/50 dark:bg-black/40 flex justify-end">
          <Button
            variant="outline"
            onPress={onClose}
            className="bg-slate-900 text-white dark:bg-white dark:text-black font-bold text-xs rounded-full px-6 h-10 border-transparent shadow-md"
          >
            Cerrar Comparador
          </Button>
        </div>
      </div>
    </div>
  );
}
