'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { CalculatedStation, DiscountRule, FuelType, FUEL_TYPES } from '@/lib/types/fuel';
import { CalculatedEVStation, EVConnectorType, EVPowerCategory } from '@/lib/types/ev';
import { DEFAULT_LOYALTY_PROGRAMS } from '@/lib/data/seed-programs';
import Navbar from '@/components/Navbar';
import FilterBar from '@/components/FilterBar';
import StationCard from '@/components/StationCard';
import EVStationCard from '@/components/EVStationCard';
import DiscountManagerModal from '@/components/DiscountManagerModal';
import CompareModal from '@/components/CompareModal';
import { Button, Chip } from '@heroui/react';
import { Sparkles, Layers, ArrowRight, ShieldCheck, CreditCard, Fuel, AlertCircle, RefreshCw, Zap, BatteryCharging } from 'lucide-react';

// Dynamic import for Leaflet Map to avoid SSR errors
const MapView = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[380px] bg-slate-100 dark:bg-black/60 rounded-[2.5rem] flex items-center justify-center border border-black/10 dark:border-white/10 animate-pulse text-slate-500 dark:text-zinc-500 text-xs font-semibold">
      Cargando mapa interactivo...
    </div>
  ),
});

export default function FuelIQHome() {
  // Mode state: 'fuel' (Combustibles) or 'ev' (Coches Eléctricos)
  const [activeMode, setActiveMode] = useState<'fuel' | 'ev'>('fuel');

  // Theme state (Light / Dark)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // State (Default to Madrid)
  const [selectedFuel, setSelectedFuel] = useState<FuelType>('GASOLINA_95_E5');
  const [userLat, setUserLat] = useState<number>(40.4168);
  const [userLng, setUserLng] = useState<number>(-3.7038);
  const [selectedCityName, setSelectedCityName] = useState<string>('Madrid');
  const [radius, setRadius] = useState<number>(10);
  const [tankCapacity, setTankCapacity] = useState<number>(50);
  const [sortBy, setSortBy] = useState<'finalPrice' | 'distance' | 'tankSaving' | 'officialPrice' | 'smartScore'>('finalPrice');
  const [discounts, setDiscounts] = useState<DiscountRule[]>(DEFAULT_LOYALTY_PROGRAMS);

  // EV Specific State
  const [evPowerCategory, setEvPowerCategory] = useState<EVPowerCategory>('ALL');
  const [evBatteryCapacity, setEvBatteryCapacity] = useState<number>(60); // 60 kWh default
  const [evSelectedConnectors, setEvSelectedConnectors] = useState<EVConnectorType[]>([]);

  // Results
  const [stations, setStations] = useState<CalculatedStation[]>([]);
  const [bestOption, setBestOption] = useState<CalculatedStation | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [comparedStationIds, setComparedStationIds] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<{
    avgOfficialPrice: number;
    avgFinalPrice: number;
    maxSaving: number;
  } | null>(null);

  // Status & Modals
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isDiscountsModalOpen, setIsDiscountsModalOpen] = useState<boolean>(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [totalDbStations, setTotalDbStations] = useState<number>(0);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Reverse geocode & apply coordinates helper
  const applyCoordinates = async (lat: number, lng: number, fallbackName?: string) => {
    setUserLat(lat);
    setUserLng(lng);
    setSelectedStationId(null);
    try {
      const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        const detectedName = data.name || data.municipality || fallbackName || 'Mi Ubicación';
        setSelectedCityName(detectedName);
        try {
          localStorage.setItem(
            'fueliq_last_location',
            JSON.stringify({ lat, lng, name: detectedName })
          );
        } catch {}
        return;
      }
    } catch {}
    const finalName = fallbackName || 'Mi Ubicación';
    setSelectedCityName(finalName);
    try {
      localStorage.setItem(
        'fueliq_last_location',
        JSON.stringify({ lat, lng, name: finalName })
      );
    } catch {}
  };

  // Initialize Theme from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fueliq_theme');
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
        if (saved === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        document.documentElement.classList.add('dark');
      }
    } catch {}
  }, []);

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('fueliq_theme', next);
    } catch {}
  };

  // Auto-detect user geolocation or restore last location on page load
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Restore last known user location from localStorage if present
    try {
      const saved = localStorage.getItem('fueliq_last_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lat && parsed.lng) {
          setUserLat(parsed.lat);
          setUserLng(parsed.lng);
          if (parsed.name) setSelectedCityName(parsed.name);
        }
      }
    } catch {}

    // 2. Request real-time GPS geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          applyCoordinates(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.log('GPS not granted or timed out, keeping default/saved location', err?.message);
        },
        { timeout: 10000, enableHighAccuracy: false, maximumAge: 300000 }
      );
    }
  }, []);

  // Load saved discounts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fueliq_user_discounts');
      if (saved) {
        setDiscounts(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const handleUpdateDiscounts = (updated: DiscountRule[]) => {
    setDiscounts(updated);
    try {
      localStorage.setItem('fueliq_user_discounts', JSON.stringify(updated));
    } catch {}
  };

  // Fetch best prices for fuel
  const fetchBestPrices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/best-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: userLat,
          lng: userLng,
          radius,
          fuel: selectedFuel,
          tankCapacity,
          sortBy,
          discounts,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setStations(data.results || []);
        setBestOption(data.bestOption || null);
        setMetrics(data.metrics || null);
      }
    } catch (err) {
      console.error('Error fetching prices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userLat, userLng, radius, selectedFuel, tankCapacity, sortBy, discounts]);

  // EV Results
  const [calculatedEVStations, setCalculatedEVStations] = useState<CalculatedEVStation[]>([]);
  const [evMetrics, setEvMetrics] = useState<{
    avgPricePerKwh: number;
    maxPowerKw: number;
    batteryCapacityKwh: number;
    maxSaving: number;
  } | null>(null);

  // Fetch EV Stations from endpoint
  const fetchEVStations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ev-stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: userLat,
          lng: userLng,
          radius: radius * 2, // Generous radius for EV charging hubs
          powerCategory: evPowerCategory,
          connectors: evSelectedConnectors,
          batteryCapacityKwh: evBatteryCapacity,
          targetChargePercentage: 70,
          discounts,
          sortBy,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCalculatedEVStations(data.results || []);
        setEvMetrics(data.metrics || null);
      }
    } catch (err) {
      console.error('Error fetching EV stations from endpoint:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userLat, userLng, radius, evPowerCategory, evSelectedConnectors, evBatteryCapacity, discounts, sortBy]);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        const count = data.stationsTotal ?? data.totalStations ?? 0;
        setTotalDbStations(count);
        const syncDate = data.lastSync?.finishedAt || data.lastSync?.startedAt || (typeof data.lastSync === 'string' ? data.lastSync : null);
        if (syncDate) {
          const d = new Date(syncDate);
          if (!isNaN(d.getTime())) {
            setLastSyncTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeMode === 'fuel') {
      fetchBestPrices();
    } else {
      fetchEVStations();
    }
  }, [fetchBestPrices, fetchEVStations, activeMode]);

  // Toggle EV Connector filter
  const handleToggleEVConnector = (conn: EVConnectorType) => {
    if (evSelectedConnectors.includes(conn)) {
      setEvSelectedConnectors(evSelectedConnectors.filter((c) => c !== conn));
    } else {
      setEvSelectedConnectors([...evSelectedConnectors, conn]);
    }
  };

  // Sync Trigger
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncToast('Sincronizando precios con la base oficial del Ministerio...');
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncToast(`¡Sincronización completada! ${data.result.pricesChanged} precios actualizados.`);
        fetchBestPrices();
        fetchStats();
      } else {
        setSyncToast(`Error en la sincronización: ${data.error}`);
      }
    } catch (err) {
      setSyncToast('Error de conexión al sincronizar con el Ministerio.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncToast(null), 5000);
    }
  };

  // Geolocation trigger
  const handleLocateUser = () => {
    setIsLocating(true);
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await applyCoordinates(pos.coords.latitude, pos.coords.longitude);
          setIsLocating(false);
        },
        () => {
          // Retry with high accuracy if fast attempt timed out
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              await applyCoordinates(pos.coords.latitude, pos.coords.longitude);
              setIsLocating(false);
            },
            () => {
              alert('No se pudo acceder a tu ubicación GPS. Por favor, escribe tu municipio o código postal en el buscador.');
              setIsLocating(false);
            },
            { timeout: 10000, enableHighAccuracy: true }
          );
        },
        { timeout: 8000, enableHighAccuracy: false, maximumAge: 60000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleSelectStation = (id: string) => {
    setSelectedStationId(id);
  };

  const handleToggleCompare = (id: string) => {
    if (comparedStationIds.includes(id)) {
      setComparedStationIds(comparedStationIds.filter((item) => item !== id));
    } else {
      if (comparedStationIds.length >= 4) {
        alert('Puedes comparar un máximo de 4 opciones simultáneamente');
        return;
      }
      setComparedStationIds([...comparedStationIds, id]);
    }
  };

  const comparedStations = stations.filter((s) => comparedStationIds.includes(s.station.id));

  // EV Metrics calculations
  const evAvgPrice = useMemo(() => {
    if (calculatedEVStations.length === 0) return 0.45;
    const sum = calculatedEVStations.reduce((acc, curr) => acc + curr.effectivePricePerKwh, 0);
    return Math.round((sum / calculatedEVStations.length) * 100) / 100;
  }, [calculatedEVStations]);

  const evMaxPower = useMemo(() => {
    if (calculatedEVStations.length === 0) return 350;
    return Math.max(...calculatedEVStations.map((s) => s.station.maxPowerKw));
  }, [calculatedEVStations]);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-[#00D97E] selection:text-black">
      {/* Revolut-styled Navbar with theme toggle & Fuel/EV mode switcher */}
      <Navbar
        activeMode={activeMode}
        onSelectMode={(m) => {
          setActiveMode(m);
          setSelectedStationId(null);
        }}
        onSync={handleSync}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        totalStations={totalDbStations}
        onOpenDiscountsModal={() => setIsDiscountsModalOpen(true)}
        activeDiscountsCount={discounts.filter((d) => d.active).length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Sync toast notification */}
      {syncToast && (
        <div className="bg-[#00D97E] text-black px-4 py-2.5 text-center text-xs font-black tracking-wide sticky top-18 z-30 shadow-lg shadow-[#00D97E]/20">
          {syncToast}
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-7">
        {/* Revolut Hero Bento Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Hero Card */}
          <div className="lg:col-span-8 revolut-card rounded-[2.5rem] p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden">
            <div className={`absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
              activeMode === 'ev'
                ? 'bg-gradient-to-br from-cyan-500/20 via-[#00D97E]/10 to-transparent'
                : 'bg-gradient-to-br from-[#0075FF]/20 via-[#00D97E]/10 to-transparent'
            }`} />

            <div className="space-y-4 relative z-10">
              {/* Badges */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {activeMode === 'ev' ? (
                  <>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-cyan-600 dark:text-cyan-400 text-[11px] font-black tracking-wider uppercase shadow-sm">
                      <Zap className="w-3.5 h-3.5" />
                      <span>⚡ Red de Carga Inteligente</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/5 dark:bg-white/10 text-slate-700 dark:text-zinc-200 border border-slate-900/10 dark:border-white/15 text-[11px] font-extrabold tracking-wide">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Tesla · Ionity · Zunder · Iberdrola · Repsol</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D97E]/15 border border-[#00D97E]/35 text-[#00A860] dark:text-[#00D97E] text-[11px] font-black tracking-wider uppercase shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Descuento Personalizado</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/5 dark:bg-white/10 text-slate-700 dark:text-zinc-200 border border-slate-900/10 dark:border-white/15 text-[11px] font-extrabold tracking-wide">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0075FF]" />
                      <span>MITECO 100% Oficial</span>
                    </div>
                  </>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                {activeMode === 'ev' ? (
                  <>
                    Tu recarga eléctrica, al <br className="hidden sm:inline" />
                    <span className="bg-gradient-to-r from-cyan-500 via-teal-400 to-[#00D97E] bg-clip-text text-transparent">
                      mejor precio por kWh
                    </span>
                  </>
                ) : (
                  <>
                    Tu combustible, al <br className="hidden sm:inline" />
                    <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-[#00A860] dark:from-white dark:via-zinc-200 dark:to-[#00D97E] bg-clip-text text-transparent">
                      tipo de cambio real
                    </span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 font-medium max-w-xl leading-relaxed">
                {activeMode === 'ev'
                  ? 'ElectroIQ compara los puntos de recarga ultrarrápidos y públicos en España, calculando el coste real de cargar la batería de tu coche eléctrico (10% → 80%) y aplicando tus membresías.'
                  : 'FuelIQ analiza los precios oficiales de surtidor y aplica automáticamente tus tarjetas de fidelización (Waylet, Cepsa Gow, BPme, Shell ClubSmart, ChequeAhorro) para decirte cuánto vas a pagar realmente.'}
              </p>
            </div>

            <div className="pt-6 relative z-10 flex items-center gap-3 flex-wrap">
              <Button
                variant="primary"
                onPress={() => setIsDiscountsModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-black text-xs rounded-full px-6 h-11 shadow-xl shadow-black/10 dark:shadow-white/10 flex items-center gap-2"
              >
                <span>Configurar mis Tarjetas & Membresías ({discounts.filter((d) => d.active).length})</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* KPI Widget Cards (Revolut Vault aesthetic) */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4">
            {activeMode === 'ev' ? (
              <>
                {/* Max Power Available */}
                <div className="flex-1 revolut-card-glow rounded-[2rem] p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> Potencia Máx Cercana
                    </span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  </div>
                  <div className="my-2">
                    <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {evMaxPower}{' '}
                      <span className="text-xl text-cyan-500">kW</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-1">
                      Carga Ultrarrápida (10% → 80% en ~18 min)
                    </div>
                  </div>
                </div>

                {/* Average Price per kWh */}
                <div className="flex-1 revolut-card rounded-[2rem] p-6 flex flex-col justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Tarifa Media Efectiva
                  </span>
                  <div className="my-2">
                    <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {evAvgPrice.toFixed(2)}{' '}
                      <span className="text-base text-slate-500 dark:text-zinc-400 font-bold">€/kWh</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-1">
                      Carga completa ({evBatteryCapacity} kWh): ~{((evBatteryCapacity * 0.7) * evAvgPrice).toFixed(2)} €
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Max Savings Widget */}
                <div className="flex-1 revolut-card-glow rounded-[2rem] p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#00A860] dark:text-[#00D97E]">
                      Ahorro Máx en Llenado
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#00D97E] animate-ping" />
                  </div>
                  <div className="my-2">
                    <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      +{metrics ? metrics.maxSaving.toFixed(2) : '0.00'}{' '}
                      <span className="text-xl text-[#00A860] dark:text-[#00D97E]">€</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-1">
                      En un solo depósito de {tankCapacity} Litros
                    </div>
                  </div>
                </div>

                {/* Average Price Widget */}
                <div className="flex-1 revolut-card rounded-[2rem] p-6 flex flex-col justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Precio Efectivo Medio
                  </span>
                  <div className="my-2">
                    <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {metrics ? metrics.avgFinalPrice.toFixed(3) : '1.429'}{' '}
                      <span className="text-base text-slate-500 dark:text-zinc-400 font-bold">€/L</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-1">
                      {FUEL_TYPES[selectedFuel].label} en tu zona
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Filter Bar */}
        <FilterBar
          activeMode={activeMode}
          selectedFuel={selectedFuel}
          onSelectFuel={setSelectedFuel}
          radius={radius}
          onSelectRadius={setRadius}
          tankCapacity={tankCapacity}
          onChangeTankCapacity={setTankCapacity}
          sortBy={sortBy}
          onChangeSortBy={setSortBy}
          onLocateUser={handleLocateUser}
          isLocating={isLocating}
          selectedCityName={selectedCityName}
          onSelectCity={(name, lat, lng) => {
            setSelectedCityName(name);
            setUserLat(lat);
            setUserLng(lng);
            setSelectedStationId(null);
            try {
              localStorage.setItem(
                'fueliq_last_location',
                JSON.stringify({ lat, lng, name })
              );
            } catch {}
          }}
          activeDiscountsCount={discounts.filter((d) => d.active).length}
          onOpenDiscountsModal={() => setIsDiscountsModalOpen(true)}
          evPowerCategory={evPowerCategory}
          onSelectEVPowerCategory={setEvPowerCategory}
          evBatteryCapacity={evBatteryCapacity}
          onChangeEVBatteryCapacity={setEvBatteryCapacity}
          evSelectedConnectors={evSelectedConnectors}
          onToggleEVConnector={handleToggleEVConnector}
        />

        {/* Floating Compare Button (Fuel Mode) */}
        {activeMode === 'fuel' && comparedStationIds.length > 0 && (
          <div className="fixed bottom-6 right-6 z-40 animate-bounce">
            <Button
              variant="primary"
              onPress={() => setIsCompareModalOpen(true)}
              className="bg-[#0075FF] hover:bg-[#0060d0] text-white font-black text-sm rounded-full px-6 h-12 shadow-2xl shadow-[#0075FF]/50 border border-white/20 flex items-center gap-2"
            >
              <Layers className="w-5 h-5" />
              <span>Ver Comparativa ({comparedStationIds.length})</span>
            </Button>
          </div>
        )}

        {/* TOP SECTION: Full-Width Interactive Map */}
        <section className="w-full space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${activeMode === 'ev' ? 'bg-cyan-400' : 'bg-[#00D97E]'}`} />
              Mapa en vivo · {activeMode === 'ev' ? `${calculatedEVStations.length} cargadores EV` : `${stations.length} gasolineras`}
            </span>
            <span className={`text-xs font-bold ${activeMode === 'ev' ? 'text-cyan-500' : 'text-[#00A860] dark:text-[#00D97E]'}`}>
              Radio de {radius} km
            </span>
          </div>

          <div className="h-[380px] sm:h-[460px] lg:h-[500px] w-full">
            <MapView
              activeMode={activeMode}
              stations={stations}
              evStations={calculatedEVStations}
              selectedStationId={selectedStationId}
              onSelectStation={handleSelectStation}
              userLat={userLat}
              userLng={userLng}
              onLocationChange={(newLat, newLng) => {
                setUserLat(newLat);
                setUserLng(newLng);
                setSelectedStationId(null);
                setSelectedCityName('Zona seleccionada en mapa');
              }}
              isLoading={isLoading}
            />
          </div>
        </section>

        {/* BOTTOM SECTION: Ranked Cards Grid */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-2 border-b border-black/5 dark:border-white/5 pb-3">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                {activeMode === 'ev' ? 'Puntos de recarga ordenados para ti' : 'Gasolineras ordenadas para ti'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                {activeMode === 'ev'
                  ? `Calculado para tu batería de ${evBatteryCapacity} kWh (10% → 80%) y tus membresías`
                  : 'Con tus descuentos personales y coste de depósito aplicado'}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full border border-black/5 dark:border-white/10">
              {activeMode === 'ev' ? `${calculatedEVStations.length} cargadores` : `${stations.length} resultados`}
            </span>
          </div>

          {activeMode === 'fuel' ? (
            /* Fuel Stations Grid */
            isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="p-6 rounded-[2rem] bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 animate-pulse h-56"
                  />
                ))}
              </div>
            ) : stations.length === 0 ? (
              <div className="p-12 text-center rounded-[2.5rem] revolut-card space-y-4 max-w-xl mx-auto">
                <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No hay gasolineras en este radio</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  Prueba aumentando el radio de búsqueda o seleccionando otra ubicación.
                </p>
                <Button
                  variant="outline"
                  onPress={() => setRadius(25)}
                  className="bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-slate-900 dark:text-white text-xs font-bold rounded-full px-6 h-10 border-black/10 dark:border-white/10"
                >
                  Ampliar a 25 km
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {stations.map((st, index) => (
                  <StationCard
                    key={st.station.id}
                    data={st}
                    rank={index + 1}
                    isSelected={selectedStationId === st.station.id}
                    onSelect={handleSelectStation}
                    isCompared={comparedStationIds.includes(st.station.id)}
                    onToggleCompare={handleToggleCompare}
                    tankCapacity={tankCapacity}
                  />
                ))}
              </div>
            )
          ) : (
            /* EV Charging Stations Grid */
            calculatedEVStations.length === 0 ? (
              <div className="p-12 text-center rounded-[2.5rem] revolut-card space-y-4 max-w-xl mx-auto">
                <Zap className="w-12 h-12 text-cyan-400 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No hay cargadores EV con estos filtros</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  Prueba seleccionando &quot;Todas las potencias&quot; o ampliando el radio de búsqueda.
                </p>
                <Button
                  variant="outline"
                  onPress={() => {
                    setEvPowerCategory('ALL');
                    setEvSelectedConnectors([]);
                    setRadius(50);
                  }}
                  className="bg-cyan-500 text-black text-xs font-bold rounded-full px-6 h-10 border-none shadow-md"
                >
                  Restablecer filtros EV
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {calculatedEVStations.map((evItem, index) => (
                  <EVStationCard
                    key={evItem.station.id}
                    data={evItem}
                    isBest={index === 0}
                    batteryCapacityKwh={evBatteryCapacity}
                  />
                ))}
              </div>
            )
          )}
        </section>
      </main>

      {/* HeroUI Modals */}
      <DiscountManagerModal
        isOpen={isDiscountsModalOpen}
        onClose={() => setIsDiscountsModalOpen(false)}
        discounts={discounts}
        onUpdateDiscounts={handleUpdateDiscounts}
      />

      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        stations={comparedStations}
        onRemoveStation={(id) => handleToggleCompare(id)}
        tankCapacity={tankCapacity}
      />
    </div>
  );
}
