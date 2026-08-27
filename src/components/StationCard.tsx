'use client';

import React from 'react';
import { CalculatedStation } from '@/lib/types/fuel';
import { getBrandInfo } from '@/lib/utils/brand-logos';
import { Button, Chip } from '@heroui/react';
import { Navigation, Clock, Sparkles, CheckCircle2, Fuel, ArrowUpRight, Tag, HelpCircle } from 'lucide-react';

interface Props {
  data: CalculatedStation;
  rank: number;
  isSelected?: boolean;
  onSelect: (id: string) => void;
  isCompared?: boolean;
  onToggleCompare?: (id: string) => void;
  tankCapacity: number;
}

export default function StationCard({
  data,
  rank,
  isSelected,
  onSelect,
  isCompared,
  onToggleCompare,
  tankCapacity,
}: Props) {
  const {
    station,
    officialPrice,
    finalPrice,
    discountPerLiter,
    savingPerLiter,
    appliedDiscountName,
    distanceKm,
    tankCostOfficial,
    tankCostFinal,
    tankSaving,
    isOpenNow,
  } = data;

  const isBest = rank === 1;
  const hasDiscount = discountPerLiter > 0;
  const brandInfo = getBrandInfo(station.brand);

  return (
    <div
      id={`station-card-${station.id}`}
      onClick={() => onSelect(station.id)}
      className={`group relative rounded-[2rem] p-5 sm:p-6 cursor-pointer transition-all duration-300 border ${
        isBest
          ? 'revolut-card-glow ring-1 ring-[#00D97E]/50'
          : isSelected
          ? 'revolut-card border-[#0075FF] ring-2 ring-[#0075FF]/30'
          : 'revolut-card hover:border-slate-300 dark:hover:border-white/20'
      }`}
    >
      {/* Top Banner: Rank + Brand + Status */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          {isBest ? (
            <Chip
              variant="primary"
              className="bg-[#00D97E] text-black font-black text-[10px] uppercase tracking-wider px-3 h-6 shadow-md shadow-[#00D97E]/20 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 fill-black inline mr-1" />
              #1 Mejor Opción
            </Chip>
          ) : (
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
              #{rank}
            </span>
          )}

          {/* Official Network Brand Badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider"
            style={{
              borderColor: `${brandInfo.primaryColor}50`,
              backgroundColor: `${brandInfo.primaryColor}18`,
              color: brandInfo.textColor,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: brandInfo.primaryColor }}
            />
            <span>{brandInfo.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              isOpenNow
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-[#00D97E]'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-500 dark:text-rose-400'
            }`}
          >
            <Clock className="w-3 h-3" />
            {isOpenNow ? 'Abierto' : 'Cerrado'}
          </span>

          {onToggleCompare && (
            <Button
              variant={isCompared ? 'primary' : 'outline'}
              onPress={() => onToggleCompare(station.id)}
              className={`h-7 px-3 text-[11px] font-bold rounded-full transition-all ${
                isCompared
                  ? 'bg-[#0075FF] text-white border-transparent shadow-md'
                  : 'bg-transparent border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isCompared ? 'En comparador ✓' : '+ Comparar'}
            </Button>
          )}
        </div>
      </div>

      {/* Station Title & Location */}
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#00B86B] dark:group-hover:text-[#00D97E] transition-colors line-clamp-1 tracking-tight">
          {station.name}
        </h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium line-clamp-1 mt-0.5">
          {station.address} · {station.municipality}
        </p>
      </div>

      {/* Financial Rate Box: Official vs Your Rate */}
      <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-black/60 border border-slate-200/80 dark:border-white/10 mb-4 space-y-2.5 shadow-inner">
        {hasDiscount ? (
          /* Case 1: Active Loyalty Discount */
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-0.5">
                Precio oficial surtidor
              </span>
              <span className="text-sm font-bold text-slate-400 dark:text-zinc-400 line-through">
                {officialPrice.toFixed(3)} €/L
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#00A860] dark:text-[#00D97E] flex items-center justify-end gap-1 mb-0.5">
                <Sparkles className="w-3 h-3" /> Tu Precio
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#00A860] dark:text-[#00D97E] tracking-tight">
                {finalPrice.toFixed(3)}{' '}
                <span className="text-xs font-bold text-[#00A860]/80 dark:text-[#00D97E]/70">€/L</span>
              </div>
            </div>
          </div>
        ) : (
          /* Case 2: No specific loyalty program for this station */
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-0.5">
                Precio publicado en surtidor
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {officialPrice.toFixed(3)}{' '}
                <span className="text-xs font-bold text-slate-400 dark:text-zinc-400">€/L</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-0.5">
                Estado fidelización
              </span>
              <span className="inline-block bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-700 dark:text-zinc-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                Tarifa base
              </span>
            </div>
          </div>
        )}

        {/* Applied loyalty rule banner */}
        {hasDiscount ? (
          <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
            <span className="text-[#00A860] dark:text-[#00D97E] font-semibold flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {appliedDiscountName || 'Descuento aplicado'}
            </span>
            <span className="bg-[#00D97E]/15 text-[#00A860] dark:text-[#00D97E] font-black text-xs px-2 py-0.5 rounded-full">
              -{savingPerLiter.toFixed(3)} €/L
            </span>
          </div>
        ) : (
          <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-500">
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400 dark:text-zinc-500" /> Sin descuento adicional para {station.brand}
            </span>
            <span className="text-slate-400 dark:text-zinc-500 font-medium">Precio directo</span>
          </div>
        )}
      </div>

      {/* Deposit Summary Widget */}
      <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-zinc-300">
            <Fuel className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-900 dark:text-white">
              Depósito ({tankCapacity} L)
            </div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400">
              {hasDiscount ? `Oficial: ${tankCostOfficial.toFixed(2)} €` : 'Coste total de llenado'}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-base font-black text-slate-900 dark:text-white">
            {tankCostFinal.toFixed(2)} €
          </div>
          {tankSaving > 0 ? (
            <div className="text-[11px] font-extrabold text-[#00A860] dark:text-[#00D97E]">
              Ahorro de +{tankSaving.toFixed(2)} €
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
              Precio estándar
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer: Distance & Navigation Action */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-[#0075FF]" />
          <span>A {distanceKm} km de ti</span>
        </div>

        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-xs font-extrabold text-[#0075FF] hover:underline transition-colors group/nav"
        >
          Navegar GPS <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/nav:translate-x-0.5 group-hover/nav:-translate-y-0.5" />
        </a>
      </div>
    </div>
  );
}
