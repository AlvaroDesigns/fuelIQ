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
  SlidersHorizontal,
  Navigation,
  Check,
  RotateCcw,
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
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

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
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node) &&
        (!mobileSearchContainerRef.current || !mobileSearchContainerRef.current.contains(e.target as Node))
      ) {
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
    <>
      {/* ============================================================ */}
      {/* 📱 MOBILE COMPACT BAR (Visible on mobile screens < 768px)     */}
      {/* ============================================================ */}
      <div className="block md:hidden space-y-3">
        {/* Mobile Search & Filter Button Row */}
        <div className="revolut-card rounded-2xl p-3 flex items-center gap-2 shadow-sm">
          {/* Quick Location / Search trigger button */}
          <button
            onClick={() => setIsMobileModalOpen(true)}
            className="flex-1 flex items-center gap-2.5 bg-slate-100 dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-full px-3.5 py-2.5 text-left text-xs text-slate-700 dark:text-zinc-300"
          >
            <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" />
            <div className="flex-1 truncate">
              <span className="font-bold text-slate-900 dark:text-white truncate block">
                {selectedCityName}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                Radio {radius} km · {FUEL_TYPES[selectedFuel].shortLabel}
              </span>
            </div>
          </button>

          {/* Quick GPS button */}
          <button
            onClick={onLocateUser}
            aria-label="Ubicar mi GPS"
            className="w-10 h-10 rounded-full bg-[#0075FF]/15 border border-[#0075FF]/30 text-[#0075FF] flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform"
          >
            <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
          </button>

          {/* Filter Modal Trigger Button with Icon & Badge */}
          <button
            onClick={() => setIsMobileModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-900 dark:bg-white text-white dark:text-black font-black text-xs h-10 px-3.5 rounded-full shadow-md active:scale-95 transition-transform shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros</span>
            <span className="w-4 h-4 rounded-full bg-[#00D97E] text-black font-black text-[10px] flex items-center justify-center ml-0.5">
              3
            </span>
          </button>
        </div>

        {/* Quick Fuel Selector Scroll on Mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none px-1">
          {primaryFuels.map((ft) => {
            const info = FUEL_TYPES[ft];
            const isSelected = selectedFuel === ft;
            return (
              <button
                key={ft}
                onClick={() => onSelectFuel(ft)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold whitespace-nowrap transition-all border shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white shadow-md'
                    : 'bg-white/80 dark:bg-black/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: info.color }}
                />
                <span>{info.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 📱 MOBILE FILTERS MODAL / BOTTOM SHEET                       */}
      {/* ============================================================ */}
      {isMobileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-xl animate-fade-in md:hidden p-0 sm:p-4">
          <div className="bg-white dark:bg-[#0c0f16] border-t sm:border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-black/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Filtros de Búsqueda
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Ajusta tu radio, combustible y vehículo
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsMobileModalOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              {/* Search by CP / Address */}
              <div ref={mobileSearchContainerRef} className="space-y-2 relative">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 block">
                  Ubicación o Código Postal
                </label>
                <div className="relative flex items-center bg-slate-100 dark:bg-black/60 border border-slate-200 dark:border-white/15 rounded-2xl p-1.5">
                  <Search className="w-4 h-4 text-slate-400 dark:text-zinc-400 ml-2 mr-1" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    placeholder="Ej. 07001, Palma, Madrid..."
                    className="flex-1 bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none py-1.5"
                  />
                  {searchInput && (
                    <button onClick={() => setSearchInput('')} className="p-1 mr-1 text-slate-400">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onLocateUser();
                      setIsMobileModalOpen(false);
                    }}
                    className="flex items-center gap-1 bg-[#0075FF] text-white text-[11px] font-black px-3 py-1.5 rounded-xl shadow-sm"
                  >
                    <Locate className="w-3 h-3" /> GPS
                  </button>
                </div>

                {/* Mobile Dropdown */}
                {isDropdownOpen && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/15 rounded-2xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                    {searchResults.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          handleSelectLocation(item);
                          setIsMobileModalOpen(false);
                        }}
                        className="w-full text-left p-2.5 hover:bg-black/5 dark:hover:bg-white/5 border-b border-black/5 dark:border-white/5 text-xs flex justify-between items-center"
                      >
                        <span className="font-bold text-slate-900 dark:text-white truncate">{item.displayName}</span>
                        {item.postalCode && (
                          <span className="text-[10px] bg-[#0075FF]/10 text-[#0075FF] font-black px-2 py-0.5 rounded-full">
                            CP {item.postalCode}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Radius Selector */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  <span>Radio de Búsqueda</span>
                  <span className="text-[#00A860] dark:text-[#00D97E]">{radius} km</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 bg-slate-100 dark:bg-black/60 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10">
                  {[5, 10, 15, 25, 50].map((r) => (
                    <button
                      key={r}
                      onClick={() => onSelectRadius(r)}
                      className={`py-2 rounded-xl text-xs font-black transition-all text-center ${
                        radius === r
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-md'
                          : 'text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      {r}km
                    </button>
                  ))}
                </div>
              </div>

              {/* Fuel Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 block">
                  Tipo de Carburante
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {primaryFuels.map((ft) => {
                    const info = FUEL_TYPES[ft];
                    const isSelected = selectedFuel === ft;
                    return (
                      <button
                        key={ft}
                        onClick={() => onSelectFuel(ft)}
                        className={`flex items-center gap-2 p-2.5 rounded-2xl text-xs font-bold border text-left transition-all ${
                          isSelected
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white shadow-md'
                            : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: info.color }}
                        />
                        <span className="truncate">{info.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tank Capacity */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
                  <span>Capacidad del depósito</span>
                  <span className="text-[#00A860] dark:text-[#00D97E] font-black">{tankCapacity} Litros</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="90"
                  step="5"
                  value={tankCapacity}
                  onChange={(e) => onChangeTankCapacity(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-300 dark:bg-zinc-800 rounded-lg appearance-none accent-[#00D97E]"
                />
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 block">
                  Ordenar Gasolineras Por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => onChangeSortBy(e.target.value as any)}
                  className="w-full bg-slate-100 dark:bg-black/60 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white rounded-2xl p-3 focus:outline-none"
                >
                  <option value="finalPrice" className="bg-white dark:bg-[#0f1117]">⭐ Mejor precio para ti (€/L)</option>
                  <option value="tankSaving" className="bg-white dark:bg-[#0f1117]">💰 Mayor ahorro total (€)</option>
                  <option value="distance" className="bg-white dark:bg-[#0f1117]">📍 Distancia más cercana</option>
                  <option value="smartScore" className="bg-white dark:bg-[#0f1117]">🧠 Smart Score</option>
                  <option value="officialPrice" className="bg-white dark:bg-[#0f1117]">🏷️ Precio oficial surtidor</option>
                </select>
              </div>

              {/* Quick Cities */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 block">
                  Accesos Rápidos
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_CITIES.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => {
                        onSelectCity(`${c.name} (CP ${c.cp})`, c.lat, c.lng);
                        setIsMobileModalOpen(false);
                      }}
                      className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40">
              <Button
                variant="primary"
                onPress={() => setIsMobileModalOpen(false)}
                className="w-full bg-slate-900 text-white dark:bg-white dark:text-black font-black text-xs rounded-full py-3 h-11 shadow-lg"
              >
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 🖥️ DESKTOP EXPANDED FILTER BAR (Visible on md+ screens)       */}
      {/* ============================================================ */}
      <div className="hidden md:block revolut-card rounded-[2.5rem] p-6 sm:p-7 space-y-6">
        {/* Top Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Unified Search Omnibox */}
          <div ref={searchContainerRef} className="relative flex-1">
            <div className="relative flex items-center bg-slate-100/90 dark:bg-black/70 border border-slate-200 dark:border-white/15 hover:border-slate-300 dark:hover:border-white/30 focus-within:border-[#0075FF] focus-within:ring-2 focus-within:ring-[#0075FF]/20 rounded-full transition-all p-1.5 shadow-sm">
              {/* Search Icon */}
              <div className="pl-3.5 pr-2 text-slate-400 dark:text-zinc-400">
                <Search className="w-4 h-4" />
              </div>

              {/* Main Input */}
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
                placeholder="Buscar por Código Postal (ej. 07001, 28001), municipio o calle..."
                className="flex-1 bg-transparent text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500 py-2 pr-3"
              />

              {/* Clear button if typed */}
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput('');
                    setSearchResults([]);
                  }}
                  className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white rounded-full mr-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Spinner if searching */}
              {isSearching && (
                <Loader2 className="w-4 h-4 text-[#0075FF] animate-spin mr-2" />
              )}

              {/* Integrated GPS Locate Pill Button */}
              <button
                onClick={onLocateUser}
                className="flex items-center gap-1.5 bg-[#0075FF] hover:bg-[#0060d0] text-white font-bold text-xs px-4 py-2 rounded-full shadow-md transition-transform active:scale-95 shrink-0"
              >
                <Locate className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Buscando...' : 'Mi GPS'}</span>
              </button>
            </div>

            {/* Autocomplete Dropdown List */}
            {isDropdownOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-[#0c0f16] border border-slate-200 dark:border-white/15 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl animate-fade-in max-h-72 overflow-y-auto">
                <div className="p-2 space-y-1">
                  <div className="px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Ubicaciones encontradas en España
                  </div>
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectLocation(item)}
                      className="w-full text-left p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-zinc-400 group-hover:text-[#0075FF] transition-colors">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#0075FF] transition-colors line-clamp-1">
                            {item.displayName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                            {item.province ? `${item.province}, España` : 'España'}
                          </div>
                        </div>
                      </div>

                      {item.postalCode && (
                        <span className="bg-[#0075FF]/10 text-[#0075FF] font-black text-[10px] h-5 px-2.5 py-0.5 rounded-full flex items-center">
                          CP {item.postalCode}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Radius Segmented Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-black/70 border border-slate-200 dark:border-white/15 p-1 rounded-full self-start lg:self-auto shrink-0 shadow-sm">
            <span className="text-[11px] font-black text-slate-400 dark:text-zinc-500 pl-3 pr-2 uppercase tracking-wider hidden sm:inline">
              Radio:
            </span>
            {[5, 10, 15, 25, 50].map((r) => (
              <button
                key={r}
                onClick={() => onSelectRadius(r)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${
                  radius === r
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-md scale-[1.02]'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        {/* Active Location Info Pill + Quick Cities Strip */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-slate-200/60 dark:border-white/5">
          {/* Active location indicator */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D97E]/10 border border-[#00D97E]/30 text-xs text-slate-800 dark:text-zinc-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#00D97E] animate-pulse" />
            <span>Zona activa:</span>
            <span className="font-black text-slate-950 dark:text-white">{selectedCityName}</span>
          </div>

          {/* Quick City Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 whitespace-nowrap mr-1">
              Accesos directos:
            </span>
            {QUICK_CITIES.map((c) => {
              const isSelected = selectedCityName.includes(c.name);
              return (
                <button
                  key={c.name}
                  onClick={() => onSelectCity(`${c.name} (CP ${c.cp})`, c.lat, c.lng)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white shadow-sm font-black'
                      : 'bg-slate-100/80 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  {c.name} <span className="opacity-60 text-[10px]">({c.cp})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fuel Type Segmented Selector */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-black text-slate-700 dark:text-zinc-300">
              <Fuel className="w-3.5 h-3.5 text-[#00D97E]" /> Tipo de Carburante
            </span>
            <span className="text-slate-400 dark:text-zinc-500 font-medium text-[11px]">Precios oficiales MITECO</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {primaryFuels.map((ft) => {
              const info = FUEL_TYPES[ft];
              const isSelected = selectedFuel === ft;
              return (
                <button
                  key={ft}
                  onClick={() => onSelectFuel(ft)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white shadow-lg scale-[1.02]'
                      : 'bg-slate-100/80 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full ring-2 ring-black/10 dark:ring-black/40"
                    style={{ backgroundColor: info.color }}
                  />
                  <span>{info.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Row: Deposit Slider & Sorting Criteria */}
        <div className="pt-4 border-t border-slate-200/60 dark:border-white/5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
          {/* Tank Capacity Slider */}
          <div className="flex items-center gap-4 bg-slate-100/70 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-3.5 rounded-2xl flex-1 max-w-xl shadow-inner">
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
              className="bg-white dark:bg-black/80 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-xs font-bold text-slate-900 dark:text-white rounded-full px-4 py-2.5 focus:outline-none focus:border-[#00D97E] transition-all cursor-pointer shadow-sm"
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
    </>
  );
}
