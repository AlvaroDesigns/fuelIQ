'use client';

import React from 'react';
import { CalculatedStation } from '@/lib/types/fuel';
import { Button, Chip } from '@heroui/react';
import { X, Sparkles, Navigation, CheckCircle2, Layers, ArrowLeft } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 w-full h-full bg-[#f6f8fb] dark:bg-[#04060a] flex flex-col overflow-hidden animate-fade-in transition-colors">
      {/* Sticky Header (100% full width) */}
      <header className="sticky top-0 z-20 w-full border-b border-black/10 dark:border-white/10 bg-white/90 dark:bg-black/90 backdrop-blur-2xl px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all shadow-sm"
              aria-label="Cerrar comparador"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#0075FF]" />
                Comparativa de Precios & Ahorro
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium hidden sm:block">
                Coste real para llenar un depósito de {tankCapacity} Litros con tus descuentos personales
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Fullscreen Comparison Content */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          <div className={`grid grid-cols-1 md:grid-cols-${Math.min(stations.length, 3)} gap-6`}>
            {stations.map((item, index) => {
              const isBest = index === 0;
              return (
                <div
                  key={item.station.id}
                  className={`p-6 sm:p-7 rounded-[2.5rem] border flex flex-col justify-between relative transition-all shadow-lg ${
                    isBest
                      ? 'bg-gradient-to-b from-[#00D97E]/15 to-white dark:to-[#0c0f16] border-[#00D97E]/50 shadow-2xl ring-2 ring-[#00D97E]/30'
                      : 'bg-white dark:bg-[#12161f] border-slate-300/80 dark:border-white/15'
                  }`}
                >
                  <button
                    onClick={() => onRemoveStation(item.station.id)}
                    className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    aria-label="Quitar gasolinera"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div>
                    {isBest && (
                      <span className="inline-block bg-[#00D97E] text-black font-black text-[11px] uppercase mb-4 px-3 py-1 rounded-full shadow-md">
                        ⭐ Mejor Precio
                      </span>
                    )}

                    <div className="font-black text-2xl text-slate-950 dark:text-white tracking-tight">{item.station.brand}</div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-medium line-clamp-1 mt-1">{item.station.name}</div>
                    <div className="text-[11px] text-slate-400 dark:text-zinc-500 line-clamp-1 mb-6">{item.station.address}</div>

                    {/* Breakdown */}
                    <div className="space-y-3.5 p-5 rounded-2xl bg-slate-50 dark:bg-black/70 border border-slate-200 dark:border-white/10 text-xs mb-5 shadow-inner">
                      <div className="flex justify-between items-center text-slate-500 dark:text-zinc-400">
                        <span>Precio oficial:</span>
                        <span className="line-through font-semibold">{item.officialPrice.toFixed(3)} €/L</span>
                      </div>

                      <div className="flex justify-between items-center text-[#00A860] dark:text-[#00D97E]">
                        <span>Descuento aplicado:</span>
                        <span className="font-black">
                          {item.discountPerLiter > 0
                            ? `-${item.discountPerLiter.toFixed(3)} €/L`
                            : '0,000 €/L'}
                        </span>
                      </div>

                      {item.appliedDiscountName && (
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 italic">
                          ({item.appliedDiscountName})
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-sm font-black text-slate-950 dark:text-white">
                        <span>Precio para ti:</span>
                        <span className="text-[#00A860] dark:text-[#00D97E] text-lg">{item.finalPrice.toFixed(3)} €/L</span>
                      </div>
                    </div>

                    {/* Tank calculation */}
                    <div className="space-y-2 p-5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-xs mb-6">
                      <div className="flex justify-between text-slate-700 dark:text-zinc-300">
                        <span>Coste depósito ({tankCapacity}L):</span>
                        <span className="font-black text-base text-slate-950 dark:text-white">{item.tankCostFinal.toFixed(2)} €</span>
                      </div>
                      {item.tankSaving > 0 && (
                        <div className="flex justify-between text-[#00A860] dark:text-[#00D97E] font-black text-xs sm:text-sm">
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
                    className="w-full text-center bg-slate-950 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-black text-xs py-3.5 rounded-full transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" /> Navegar con GPS
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <footer className="sticky bottom-0 z-20 w-full border-t border-black/10 dark:border-white/10 bg-white/95 dark:bg-black/95 backdrop-blur-2xl px-4 sm:px-8 py-4 shadow-2xl flex justify-center">
        <div className="max-w-5xl w-full flex justify-end">
          <Button
            variant="outline"
            onPress={onClose}
            className="bg-slate-950 text-white dark:bg-white dark:text-black font-black text-xs sm:text-sm rounded-full px-8 h-12 shadow-md border-transparent hover:bg-slate-800 dark:hover:bg-zinc-200"
          >
            Cerrar Comparador
          </Button>
        </div>
      </footer>
    </div>
  );
}
