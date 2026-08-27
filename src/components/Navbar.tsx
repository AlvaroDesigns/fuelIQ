"use client";

import { Button } from "@heroui/react";
import { CreditCard, Database, Fuel, Moon, RefreshCw, Sun } from "lucide-react";

interface Props {
  onSync: () => void;
  isSyncing: boolean;
  lastSyncTime?: string | null;
  totalStations?: number;
  onOpenDiscountsModal: () => void;
  activeDiscountsCount: number;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  activeMode: "fuel" | "ev";
  onSelectMode: (mode: "fuel" | "ev") => void;
}

export default function Navbar({
  onSync,
  isSyncing,
  lastSyncTime,
  totalStations,
  onOpenDiscountsModal,
  activeDiscountsCount,
  theme,
  onToggleTheme,
  activeMode,
  onSelectMode,
}: Props) {
  const isDark = theme === "dark";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-2xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
        {/* Brand + Mode Selector */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00D97E] via-[#0075FF] to-[#8000FF] p-[1.5px] shadow-lg shadow-[#00D97E]/10 flex items-center justify-center">
              <div className="w-full h-full bg-white dark:bg-[#08090d] rounded-[14px] flex items-center justify-center transition-colors">
                <Fuel className="w-5 h-5 text-[#00D97E]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Fuel<span className="text-[#00D97E]">IQ</span>
                </span>
                <span className="bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-800 dark:text-white/90 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  {activeMode === "ev" ? "⚡ ElectroIQ" : "Metal Tier"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium hidden md:block">
                {activeMode === "ev"
                  ? "Puntos de recarga y tarifas kWh"
                  : "Tu combustible, al tipo de cambio real"}
              </p>
            </div>
          </div>

          {/* Central Segmented Mode Switcher [ ⛽ Combustibles | ⚡ Eléctricos ] */}
          <div className="flex items-center bg-black/[0.05] dark:bg-white/10 p-1 rounded-full border border-black/10 dark:border-white/10">
            <button
              onClick={() => onSelectMode("fuel")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                activeMode === "fuel"
                  ? "bg-white dark:bg-[#151a24] text-slate-950 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white"
              }`}
            >
              <Fuel className="w-3.5 h-3.5 text-[#00A860] dark:text-[#00D97E]" />
              <span>Combustibles</span>
            </button>
            <button
              onClick={() => onSelectMode("ev")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                activeMode === "ev"
                  ? "bg-gradient-to-r from-cyan-500 to-[#00D97E] text-slate-950 font-black shadow-sm"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white"
              }`}
            >
              <span className="text-xs">⚡</span>
              <span>Eléctricos</span>
            </button>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Virtual Loyalty Cards Button with elegant circular pill badge */}
          <button
            onClick={onOpenDiscountsModal}
            className="flex items-center gap-2 bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.08] dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white font-bold text-xs rounded-full px-3.5 sm:px-4 h-9 transition-all shadow-sm"
          >
            <CreditCard className="w-4 h-4 text-[#0075FF]" />
            <span className="hidden sm:inline">Tarjetas & Descuentos</span>
            <span className="px-2 h-5 rounded-full bg-[#00D97E] text-black font-black text-[11px] flex items-center justify-center shadow-sm">
              {activeDiscountsCount}
            </span>
          </button>

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={onToggleTheme}
            aria-label="Cambiar tema"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-black/[0.04] dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-700 dark:text-zinc-200 hover:text-black dark:hover:text-white hover:bg-black/[0.08] dark:hover:bg-white/10 transition-all shadow-sm"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Sync status */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
            <Database className="w-3.5 h-3.5 text-[#00D97E]" />
            <span>
              {totalStations ? `${totalStations} gasolineras` : "Red MITECO"}
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-700" />
            <span className="text-slate-400 dark:text-zinc-500">
              {lastSyncTime ? `Sync ${lastSyncTime}` : "En vivo"}
            </span>
          </div>

          {/* MITECO Sync button */}
          <Button
            variant="outline"
            onPress={onSync}
            className="border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-slate-700 dark:text-zinc-200 hover:text-black dark:hover:text-white font-semibold text-xs rounded-full h-9 px-3.5 transition-all bg-transparent flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 ${isSyncing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">
              {isSyncing ? "Sincronizando..." : "Actualizar"}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
