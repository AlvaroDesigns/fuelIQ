"use client";

import { CalculatedEVStation } from "@/lib/types/ev";
import {
  BatteryCharging,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Plug,
  Sparkles,
  Zap,
} from "lucide-react";

interface Props {
  data: CalculatedEVStation;
  isBest?: boolean;
  batteryCapacityKwh: number;
}

export default function EVStationCard({
  data,
  isBest,
  batteryCapacityKwh,
}: Props) {
  const {
    station,
    distanceKm,
    officialPricePerKwh,
    effectivePricePerKwh,
    savingPerKwh,
    appliedDiscountName,
    sessionKwh,
    sessionCostOfficial,
    sessionCostEffective,
    sessionSaving,
    estimatedMinutesToCharge,
    smartScore,
  } = data;

  const hasDiscount = savingPerKwh > 0;

  // Power tier badge style
  const isUltra = station.maxPowerKw >= 150;
  const isRapid = station.maxPowerKw >= 50 && station.maxPowerKw < 150;

  const powerBadgeBg = isUltra
    ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30"
    : isRapid
      ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
      : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";

  const powerLabel = isUltra
    ? `${station.maxPowerKw} kW Ultrarrápida`
    : isRapid
      ? `${station.maxPowerKw} kW Rápida`
      : `${station.maxPowerKw} kW Semi-rápida`;

  // Navigation URL
  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border transition-all duration-300 backdrop-blur-xl flex flex-col justify-between ${
        isBest
          ? "bg-gradient-to-b from-cyan-500/10 via-white to-white dark:from-cyan-950/30 dark:via-[#0c1017] dark:to-[#0c1017] border-cyan-500/50 shadow-xl shadow-cyan-500/10 ring-2 ring-cyan-500/30"
          : "bg-white dark:bg-[#0c0f16]/90 border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 shadow-md hover:shadow-xl"
      }`}
    >
      {/* Top Best Choice Banner */}
      {isBest && (
        <div className="bg-gradient-to-r from-cyan-500 via-teal-400 to-[#00D97E] px-4 py-2 flex items-center justify-between text-slate-950 text-xs font-black tracking-wide shadow-sm">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span className="tracking-wider uppercase text-[11px]">PUNTO DE CARGA RECOMENDADO</span>
          </div>
          <span className="text-[10.5px] font-black bg-slate-950 text-white px-2.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">
            Mejor precio / potencia
          </span>
        </div>
      )}

      <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
        {/* Header: Operator + Power Badge + Distance */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-xs uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-zinc-200 border border-black/5 dark:border-white/10">
                {station.operatorName}
              </span>

              <span
                className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${powerBadgeBg}`}
              >
                <Zap className="w-3 h-3 fill-current" />
                {powerLabel}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-950 dark:text-white leading-snug pt-0.5">
              {station.name}
            </h2>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span className="truncate">
                {station.address}, {station.municipality}
              </span>
            </div>
          </div>

          {/* Distance Badge */}
          {distanceKm > 0 && (
            <div className="text-right shrink-0">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs font-black text-slate-800 dark:text-zinc-200">
                <Navigation className="w-3 h-3 text-cyan-500 rotate-45" />
                {distanceKm.toFixed(1)} km
              </div>
            </div>
          )}
        </div>

        {/* Pricing Card Section */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-black/5 dark:border-white/10 flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              {hasDiscount
                ? "Tarifa con ventaja / membresía"
                : "Tarifa por kWh"}
            </div>
            <div className="flex items-baseline gap-1.5 pt-0.5">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#00A860] dark:text-[#00D97E]">
                {effectivePricePerKwh.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                €/kWh
              </span>
              {hasDiscount && (
                <span className="text-xs line-through text-slate-400 dark:text-zinc-500 font-medium ml-1.5 whitespace-nowrap">
                  {officialPricePerKwh.toFixed(2)} €/kWh
                </span>
              )}
            </div>
          </div>

          {/* Connectors availability pills */}
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {station.connectors.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-zinc-200"
                >
                  <Plug className="w-3 h-3 text-cyan-500" />
                  <span>{c.type}</span>
                  <span className="text-[10px] text-[#00A860] dark:text-[#00D97E] font-black">
                    ({c.availableCount}/{c.totalCount})
                  </span>
                </div>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
              {station.isOpen24h
                ? "Abierto 24 horas"
                : station.schedule || "Consultar horario"}
            </span>
          </div>
        </div>

        {/* Applied discount info */}
        {hasDiscount && (
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-[#00A860] dark:text-[#00D97E] font-semibold flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {appliedDiscountName || "Tarifa de suscriptor aplicada"}
            </span>
            <span className="bg-[#00D97E]/15 text-[#00A860] dark:text-[#00D97E] font-black text-xs px-2 py-0.5 rounded-full">
              -{savingPerKwh.toFixed(2)} €/kWh
            </span>
          </div>
        )}

        {/* Battery Session Calculation Widget */}
        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold">
                <BatteryCharging className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  Carga estimada ({sessionKwh} kWh)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                  Para batería de {batteryCapacityKwh} kWh (10% → 80%)
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="font-black text-sm text-slate-950 dark:text-white">
                {sessionCostEffective.toFixed(2)} €
              </div>
              {hasDiscount && (
                <div className="text-[10px] text-[#00A860] dark:text-[#00D97E] font-bold">
                  Ahorras {sessionSaving.toFixed(2)} €
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5 text-[11px] text-slate-600 dark:text-zinc-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
              <span>
                Tiempo estimado: ~
                <strong className="text-slate-900 dark:text-white">
                  {estimatedMinutesToCharge} min
                </strong>
              </span>
            </div>
            {smartScore && (
              <span className="text-slate-500 dark:text-zinc-400">
                Coste total + viaje:{" "}
                <strong className="text-slate-900 dark:text-white">
                  {smartScore.toFixed(2)} €
                </strong>
              </span>
            )}
          </div>
        </div>

        {/* Amenities and Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {/* Amenities tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 flex-1">
            {station.amenities?.slice(0, 3).map((amenity, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-400 shrink-0"
              >
                {amenity}
              </span>
            ))}
          </div>

          {/* Route button */}
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 text-white dark:bg-white dark:text-black font-black text-xs shadow-md hover:bg-slate-800 dark:hover:bg-zinc-200 transition-all shrink-0"
          >
            <Navigation className="w-3.5 h-3.5 rotate-45" />
            <span>Cómo llegar</span>
          </a>
        </div>
      </div>
    </div>
  );
}
