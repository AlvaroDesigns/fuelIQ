'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FUEL_TYPES, FuelType } from '@/lib/types/fuel';
import { Button, Chip } from '@heroui/react';
import {
  MapPin,
  Locate,
  Fuel,
  ArrowUpDown,
  Search,
  X,
  Sparkles,
  Loader2,
  Navigation,
} from 'lucide-react';

interface Props {
  selectedFuel: FuelType;
  onSelectFuel: (f: FuelType) => void;
  radius: number;
  onSelectRadius: (r: number) => void;
  tankCapacity: number;
  onChangeTankCapacity: (l: number) => void;
  sortBy: 'finalPrice' | 'distance' | 'tankSaving' | 'officialPrice' | 'smartScore';
  onChangeSortBy: (s: 'finalPrice' | 'distance' | 'tankSaving' | 'officialPrice' | 'smartScore') => void;
  onLocateUser: () => void;
  isLocating: boolean;
  selectedCityName: string;
  onSelectCity: (cityName: string, lat: number, lng: number) => void;
  activeDiscountsCount: number;
  onOpenDiscountsModal: () => void;
}

interface GeocodeResult {
  displayName: string;
  name: string;
  postalCode?: string;
  municipality?: string;
  province?: string;
  lat: number;
  lng: number;
}

const QUICK_CITIES = [
  { name: 'Palma', cp: '07001', lat: 39.5696, lng: 2.6502 },
  { name: 'Madrid', cp: '28001', lat: 40.4168, lng: -3.7038 },
  { name: 'Barcelona', cp: '08001', lat: 41.3851, lng: 2.1734 },
  { name: 'Valencia', cp: '46001', lat: 39.4699, lng: -0.3763 },
  { name: 'Sevilla', cp: '41001', lat: 37.3891, lng: -5.9845 },
  { name: 'Oviedo', cp: '33001', lat: 43.3619, lng: -5.8494 },
  { name: 'Zaragoza', cp: '50001', lat: 41.6488, lng: -0.8891 },
  { name: 'Bilbao', cp: '48001', lat: 43.263, lng: -2.935 },
  { name: 'Málaga', cp: '29001', lat: 36.7213, lng: -4.4214 },
  { name: 'A Coruña', cp: '15001', lat: 43.3623, lng: -8.4115 },
  { name: 'Alicante', cp: '03001', lat: 38.3452, lng: -0.481 },
];

export default function FilterBar({
  selectedFuel,
  onSelectFuel,
  radius,
  onSelectRadius,
  tankCapacity,
  onChangeTankCapacity,
  sortBy,
  onChangeSortBy,
  onLocateUser,
  isLocating,
  selectedCityName,
  onSelectCity,
  activeDiscountsCount,
  onOpenDiscountsModal,
}: Props) {
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const primaryFuels: FuelType[] = [
    'GASOLINA_95_E5',
    'GASOLEO_A',
    'GASOLINA_98_E5',
    'GASOLEO_PREMIUM',
    'GLP',
    'GNC',
    'DIESEL_RENOVABLE',
  ];

  // Live Geocode Debounced Search for Postal Code or City / Address
  useEffect(() => {
    const q = searchInput.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
          setIsDropdownOpen(true);
        }
      } catch (err) {
        console.error('Geocode search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Click outside to close autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLocation = (loc: GeocodeResult) => {
    const label = loc.postalCode
      ? `${loc.name} (CP ${loc.postalCode})`
      : loc.displayName;
    onSelectCity(label, loc.lat, loc.lng);
    setSearchInput('');
    setIsDropdownOpen(false);
  };

  return (
    <div className="revolut-card rounded-[2rem] p-5 sm:p-6 space-y-5">
      {/* Top Row: Location & CP Search Bar + GPS Button */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search input + GPS button */}
        <div className="flex items-center gap-2.5 flex-1 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            onPress={onLocateUser}
            className="bg-[#0075FF]/10 hover:bg-[#0075FF]/20 text-[#0075FF] border-[#0075FF]/30 font-bold text-xs rounded-full h-11 px-4 transition-all flex items-center gap-2 shadow-sm"
          >
            <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Obteniendo...' : 'Mi GPS'}</span>
          </Button>

          {/* Autocomplete Input Container */}
          <div ref={searchContainerRef} className="relative flex-1 min-w-[240px]">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 dark:text-zinc-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => {
                  if (searchResults.length > 0) setIsDropdownOpen(true);
                }}
                placeholder="Buscar por Código Postal (ej. 07001, 28001), Ciudad o Calle..."
                className="w-full bg-slate-100 dark:bg-black/60 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 focus:border-[#00D97E] text-slate-900 dark:text-white text-xs font-semibold rounded-full pl-11 pr-10 py-3 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500 shadow-inner"
              />
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-[#00D97E] animate-spin absolute right-4 pointer-events-none" />
              ) : searchInput ? (
                <button
                  onClick={() => {
                    setSearchInput('');
                    setSearchResults([]);
                  }}
                  className="absolute right-4 text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>

            {/* Current Active Location Badge */}
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 px-3">
              <MapPin className="w-3.5 h-3.5 text-[#00D97E]" />
              <span>Ubicación activa:</span>
              <span className="text-slate-900 dark:text-white font-bold">{selectedCityName}</span>
            </div>

            {/* Autocomplete Dropdown */}
            {isDropdownOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-[#0c0f16] border border-black/10 dark:border-white/15 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl animate-fade-in max-h-72 overflow-y-auto">
                <div className="p-2 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Resultados de Ubicación / Código Postal
                  </div>
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectLocation(item)}
                      className="w-full text-left p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-zinc-400 group-hover:text-[#00D97E] transition-colors">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#00D97E] transition-colors line-clamp-1">
                            {item.displayName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                            {item.province ? `${item.province}, España` : 'España'}
                          </div>
                        </div>
                      </div>

                      {item.postalCode && (
                        <span className="bg-[#00D97E]/15 text-[#00A860] dark:text-[#00D97E] font-black text-[10px] h-5 px-2 py-0.5 rounded-full flex items-center">
                          CP {item.postalCode}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Radius Segmented Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/60 border border-black/10 dark:border-white/10 p-1 rounded-full self-start lg:self-auto shadow-inner">
          <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-500 px-3 uppercase tracking-wider hidden sm:inline">
            Radio
          </span>
          {[5, 10, 15, 25, 50].map((r) => (
            <button
              key={r}
              onClick={() => onSelectRadius(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                radius === r
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-md'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {r}km
            </button>
          ))}
        </div>
      </div>

      {/* Quick City Presets Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 whitespace-nowrap mr-1">
          Ciudades:
        </span>
        {QUICK_CITIES.map((c) => (
          <button
            key={c.name}
            onClick={() => onSelectCity(`${c.name} (CP ${c.cp})`, c.lat, c.lng)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border ${
              selectedCityName.includes(c.name)
                ? 'bg-[#00D97E]/15 text-[#00A860] dark:text-[#00D97E] border-[#00D97E]/40 font-black'
                : 'bg-black/[0.03] dark:bg-white/[0.02] border-black/5 dark:border-white/5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:border-black/15 dark:hover:border-white/15'
            }`}
          >
            {c.name} <span className="opacity-60 text-[10px]">({c.cp})</span>
          </button>
        ))}
      </div>

      {/* Fuel Type Segmented Selector */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2.5 flex items-center justify-between">
          <span>Tipo de Carburante</span>
          <span className="text-slate-400 dark:text-zinc-500 font-normal">Precios oficiales MITECO normalizados</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {primaryFuels.map((ft) => {
            const info = FUEL_TYPES[ft];
            const isSelected = selectedFuel === ft;
            return (
              <button
                key={ft}
                onClick={() => onSelectFuel(ft)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white shadow-lg scale-[1.02]'
                    : 'bg-black/[0.03] dark:bg-white/[0.03] border-black/10 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:border-black/20 dark:hover:border-white/20'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-black/20 dark:ring-black/40"
                  style={{ backgroundColor: info.color }}
                />
                <span>{info.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Slider & Sort */}
      <div className="pt-4 border-t border-black/5 dark:border-white/5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
        {/* Tank Capacity Slider */}
        <div className="flex items-center gap-4 bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 p-3.5 rounded-2xl flex-1 max-w-xl shadow-inner">
          <div className="w-9 h-9 rounded-xl bg-[#00D97E]/10 flex items-center justify-center text-[#00D97E]">
            <Fuel className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
              <span>Capacidad de tu depósito</span>
              <span className="text-[#00A860] dark:text-[#00D97E] font-black text-sm">{tankCapacity} Litros</span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              step="5"
              value={tankCapacity}
              onChange={(e) => onChangeTankCapacity(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-300 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#00D97E]"
            />
          </div>
        </div>

        {/* Sort Criteria */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" /> Ordenar por:
          </span>
          <select
            value={sortBy}
            onChange={(e) => onChangeSortBy(e.target.value as any)}
            className="bg-white dark:bg-black/80 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-xs font-bold text-slate-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:border-[#00D97E] transition-all cursor-pointer shadow-sm"
          >
            <option value="finalPrice" className="bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white">⭐ Mejor precio para ti (€/L)</option>
            <option value="tankSaving" className="bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white">💰 Mayor ahorro total (€)</option>
            <option value="distance" className="bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white">📍 Distancia más cercana</option>
            <option value="smartScore" className="bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white">🧠 Smart Score (Precio + Desplazamiento)</option>
            <option value="officialPrice" className="bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white">🏷️ Precio oficial surtidor</option>
          </select>
        </div>
      </div>
    </div>
  );
}
