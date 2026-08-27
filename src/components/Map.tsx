"use client";

import { CalculatedEVStation } from "@/lib/types/ev";
import { CalculatedStation } from "@/lib/types/fuel";
import { getBrandInfo } from "@/lib/utils/brand-logos";
import { DiscountEngine } from "@/lib/engine/discount-calculator";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

interface MapProps {
  activeMode?: "fuel" | "ev";
  stations?: CalculatedStation[];
  evStations?: CalculatedEVStation[];
  selectedStationId?: string | null;
  onSelectStation: (stationId: string) => void;
  userLat?: number | null;
  userLng?: number | null;
  onLocationChange?: (lat: number, lng: number) => void;
  isLoading?: boolean;
}

export default function MapView({
  activeMode = "fuel",
  stations = [],
  evStations = [],
  selectedStationId,
  onSelectStation,
  userLat,
  userLng,
  onLocationChange,
  isLoading = false,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());

  const onLocationChangeRef = useRef(onLocationChange);
  onLocationChangeRef.current = onLocationChange;

  // Track coordinates triggered by map drag to prevent unwanted map jump
  const lastMapDragCenterRef = useRef<{ lat: number; lng: number } | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat =
        userLat ||
        (activeMode === "fuel" && stations.length > 0
          ? stations[0].station.latitude
          : activeMode === "ev" && evStations.length > 0
            ? evStations[0].station.latitude
            : 39.5696);

      const initialLng =
        userLng ||
        (activeMode === "fuel" && stations.length > 0
          ? stations[0].station.longitude
          : activeMode === "ev" && evStations.length > 0
            ? evStations[0].station.longitude
            : 2.6502);

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 11,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // 100% Free OpenStreetMap Map Provider
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> colaboradores',
        maxZoom: 19,
        subdomains: ["a", "b", "c"],
      }).addTo(map);

      // Handle user dragging / panning map -> Auto recalculate on drag end
      const handleUserMovedMap = () => {
        const center = map.getCenter();
        lastMapDragCenterRef.current = { lat: center.lat, lng: center.lng };
        onLocationChangeRef.current?.(center.lat, center.lng);
      };

      map.on("dragend", handleUserMovedMap);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }
  }, []);

  // Update center when coordinates change from external input (search bar, GPS, quick city)
  useEffect(() => {
    if (!mapInstanceRef.current || !userLat || !userLng) return;

    // If change was triggered by map dragging, do NOT jump/reset view
    if (lastMapDragCenterRef.current) {
      const distFromDrag = DiscountEngine.calculateDistanceKm(
        lastMapDragCenterRef.current.lat,
        lastMapDragCenterRef.current.lng,
        userLat,
        userLng
      );
      if (distFromDrag < 0.05) {
        lastMapDragCenterRef.current = null;
        return;
      }
    }

    // External change (Search bar, Quick city, GPS) -> smoothly pan to location
    if (!selectedStationId) {
      mapInstanceRef.current.setView([userLat, userLng], mapInstanceRef.current.getZoom() || 12);
    }
  }, [userLat, userLng, selectedStationId]);

  // Smooth Zoom-in to selected station when clicked from card
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedStationId) return;

    if (activeMode === "fuel") {
      const targetStation = stations.find(
        (s) => s.station.id === selectedStationId,
      );
      if (targetStation) {
        mapInstanceRef.current.flyTo(
          [targetStation.station.latitude, targetStation.station.longitude],
          16,
          { animate: true, duration: 0.8 },
        );
        const marker = markersMapRef.current.get(selectedStationId);
        if (marker) marker.openPopup();
      }
    } else {
      const targetEV = evStations.find(
        (s) => s.station.id === selectedStationId,
      );
      if (targetEV) {
        mapInstanceRef.current.flyTo(
          [targetEV.station.latitude, targetEV.station.longitude],
          16,
          { animate: true, duration: 0.8 },
        );
        const marker = markersMapRef.current.get(selectedStationId);
        if (marker) marker.openPopup();
      }
    }
  }, [selectedStationId, stations, evStations, activeMode]);

  // Render station markers (Fuel or EV)
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    markersMapRef.current.clear();

    // User location marker
    if (userLat && userLng) {
      const userIcon = L.divIcon({
        className: "custom-user-marker",
        html: `
          <div class="relative flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-[#0075FF] opacity-75"></span>
            <div class="relative w-4 h-4 rounded-full bg-[#0075FF] border-2 border-white shadow-xl shadow-[#0075FF]/60"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([userLat, userLng], {
        icon: userIcon,
        title: "Centro de búsqueda",
        zIndexOffset: 2000,
      })
        .addTo(markersGroupRef.current)
        .bindPopup('<b class="text-white">📍 Centro de Búsqueda</b>');
    }

    if (activeMode === "fuel") {
      stations.forEach((item, index) => {
        const isBest = index === 0;
        const brandInfo = getBrandInfo(item.station.brand || item.station.rawBrand || "");

        const customIcon = L.divIcon({
          className: "custom-fuel-marker",
          html: `
            <div class="relative group cursor-pointer transition-transform duration-300 hover:scale-110">
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                isBest
                  ? "bg-gradient-to-r from-emerald-500 to-[#00D97E] text-slate-950 font-black shadow-lg shadow-emerald-500/50 ring-2 ring-white"
                  : "bg-slate-900/90 dark:bg-black/90 text-white font-extrabold shadow-md border border-white/20"
              } backdrop-blur-md">
                <span class="w-2 h-2 rounded-full ${isBest ? "bg-black" : "bg-emerald-400"}"></span>
                <span class="text-xs tracking-tight">${item.finalPrice.toFixed(3)} €</span>
              </div>
              <div class="w-2 h-2 ${isBest ? "bg-[#00D97E]" : "bg-slate-900 dark:bg-black"} rotate-45 mx-auto -mt-1 shadow-sm"></div>
            </div>
          `,
          iconSize: [85, 32],
          iconAnchor: [42, 32],
          popupAnchor: [0, -32],
        });

        const marker = L.marker(
          [item.station.latitude, item.station.longitude],
          {
            icon: customIcon,
            zIndexOffset: isBest ? 1000 : 100,
          },
        ).addTo(markersGroupRef.current!);

        markersMapRef.current.set(item.station.id, marker);

        const popupContent = `
          <div class="p-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-white/10 min-w-[220px]">
            <div class="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
              <span class="font-black text-sm text-emerald-400">${brandInfo.name || item.station.name}</span>
              ${isBest ? '<span class="px-2 py-0.5 text-[10px] font-black bg-[#00D97E] text-slate-950 rounded-full uppercase">Mejor Precio</span>' : ""}
            </div>
            <div class="text-xs text-zinc-300 mb-1">${item.station.address}</div>
            <div class="text-[11px] text-zinc-400 mb-2">${item.station.locality || item.station.municipality} (${item.station.municipality})</div>
            
            <div class="bg-white/5 p-2 rounded-lg mb-2">
              <div class="flex justify-between text-xs mb-1">
                <span class="text-zinc-400">Precio Surtidor:</span>
                <span class="line-through text-zinc-400">${item.officialPrice.toFixed(3)} €/L</span>
              </div>
              <div class="flex justify-between text-xs font-bold text-emerald-400">
                <span>Precio con tus Descuentos:</span>
                <span>${item.finalPrice.toFixed(3)} €/L</span>
              </div>
              <div class="flex justify-between text-[11px] text-zinc-300 mt-1 pt-1 border-t border-white/10">
                <span>Coste Estimado Depósito:</span>
                <span class="font-black text-white">${item.tankCostFinal.toFixed(2)} €</span>
              </div>
            </div>

            <a
              href="https://www.google.com/maps/dir/?api=1&destination=${item.station.latitude},${item.station.longitude}"
              target="_blank"
              rel="noopener noreferrer"
              class="block w-full text-center font-bold text-xs py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
            >
              Cómo llegar (${item.distanceKm.toFixed(1)} km) ↗
            </a>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on("click", () => {
          onSelectStation(item.station.id);
        });
      });
    } else {
      evStations.forEach((item, index) => {
        const isBest = index === 0;

        const customIcon = L.divIcon({
          className: "custom-ev-marker",
          html: `
            <div class="relative group cursor-pointer transition-transform duration-300 hover:scale-110">
              <div style="background-color: #00D97E !important; color: #000000 !important;" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-xs shadow-md border-0 ring-0">
                <span style="color: #000000 !important;" class="text-[12px]">⚡</span>
                <span style="color: #000000 !important;" class="text-xs font-black tracking-tight">${item.effectivePricePerKwh.toFixed(2)} €/kWh</span>
              </div>
              <div style="background-color: #00D97E !important;" class="w-2 h-2 rotate-45 mx-auto -mt-1 shadow-sm border-0"></div>
            </div>
          `,
          iconSize: [95, 32],
          iconAnchor: [47, 32],
          popupAnchor: [0, -32],
        });

        const marker = L.marker(
          [item.station.latitude, item.station.longitude],
          {
            icon: customIcon,
            zIndexOffset: isBest ? 1000 : 100,
          },
        ).addTo(markersGroupRef.current!);

        markersMapRef.current.set(item.station.id, marker);

        const connectorsHtml = item.station.connectors
          .map(
            (c) =>
              `<span class="inline-block text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono mr-1 mb-1">${c.type} (${c.maxPowerKw}kW)</span>`,
          )
          .join("");

        const popupContent = `
          <div class="p-3.5 bg-slate-950 text-white rounded-2xl shadow-2xl border border-white/15 min-w-[260px]">
            <div class="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
              <div class="font-black text-sm text-cyan-400">${item.station.operatorName}</div>
              <span class="px-2 py-0.5 text-[10px] font-black bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">
                ${item.station.maxPowerKw} kW
              </span>
            </div>
            
            <div class="font-bold text-xs text-zinc-200 mb-1">${item.station.name}</div>
            <div class="text-[11px] text-zinc-400 mb-2">${item.station.address} (${item.station.municipality})</div>

            <div class="bg-white/5 p-2.5 rounded-xl mb-3 border border-white/5">
              <div class="flex justify-between text-xs mb-1">
                <span class="text-zinc-400">Tarifa oficial:</span>
                <span class="text-zinc-300">${item.officialPricePerKwh.toFixed(2)} €/kWh</span>
              </div>
              <div class="flex justify-between text-xs font-bold text-cyan-400">
                <span>Tu tarifa efectiva:</span>
                <span>${item.effectivePricePerKwh.toFixed(2)} €/kWh</span>
              </div>
              <div class="flex justify-between text-[11px] text-white mt-1 pt-1 border-t border-white/10 font-bold">
                <span>Sesión (${item.sessionKwh} kWh):</span>
                <span class="text-cyan-300">${item.sessionCostEffective.toFixed(2)} €</span>
              </div>
              <div class="flex justify-between text-[11px] text-cyan-400">
                <span>Tiempo de recarga:</span>
                <span>~${item.estimatedMinutesToCharge} min</span>
              </div>
            </div>

            <div class="mb-3">
              <div class="text-[10px] text-zinc-400 uppercase font-bold mb-1">Conectores disponibles:</div>
              <div class="flex flex-wrap">${connectorsHtml}</div>
            </div>

            <a
              href="https://www.google.com/maps/dir/?api=1&destination=${item.station.latitude},${item.station.longitude}"
              target="_blank"
              rel="noopener noreferrer"
              style="color: #000000 !important; background-color: #00D97E !important; text-decoration: none !important;"
              class="block w-full text-center font-black text-xs py-2 px-3 rounded-full shadow-lg transition-transform hover:scale-[1.02]"
            >
              Cómo llegar (${item.distanceKm.toFixed(1)} km) ↗
            </a>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on("click", () => {
          onSelectStation(item.station.id);
        });
      });
    }
  }, [
    stations,
    evStations,
    activeMode,
    selectedStationId,
    userLat,
    userLng,
    onSelectStation,
  ]);

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10">
      {/* Live sync indicator badge */}
      {isLoading && (
        <div className="absolute top-4 left-4 z-[1000] px-3.5 py-1.5 bg-slate-950/85 backdrop-blur-md border border-white/15 text-white font-bold text-xs rounded-full shadow-xl flex items-center gap-2 animate-in fade-in duration-150">
          <Loader2 className="w-3.5 h-3.5 text-[#00D97E] animate-spin" />
          <span>Buscando estaciones en esta zona...</span>
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
}
