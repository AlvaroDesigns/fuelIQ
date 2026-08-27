"use client";

import { CalculatedEVStation } from "@/lib/types/ev";
import { CalculatedStation } from "@/lib/types/fuel";
import { getBrandInfo } from "@/lib/utils/brand-logos";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

interface MapProps {
  activeMode?: "fuel" | "ev";
  stations?: CalculatedStation[];
  evStations?: CalculatedEVStation[];
  selectedStationId?: string | null;
  onSelectStation: (stationId: string) => void;
  userLat?: number | null;
  userLng?: number | null;
}

export default function MapView({
  activeMode = "fuel",
  stations = [],
  evStations = [],
  selectedStationId,
  onSelectStation,
  userLat,
  userLng,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());

  // Initialize Map with balanced street-level city zoom
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
        zoom: 9,
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

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Map instance preserved
    };
  }, []);

  // Update center when user position changes (initial or geolocate)
  useEffect(() => {
    if (mapInstanceRef.current && userLat && userLng && !selectedStationId) {
      mapInstanceRef.current.setView([userLat, userLng], 13);
    }
  }, [userLat, userLng]);

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
        title: "Tu ubicación",
        zIndexOffset: 2000,
      })
        .addTo(markersGroupRef.current)
        .bindPopup('<b class="text-white">📍 Tu Ubicación</b>');
    }

    if (activeMode === "fuel") {
      // ⛽ Fuel Station Markers
      stations.forEach((item, index) => {
        const isBest = index === 0;
        const isSelected = selectedStationId === item.station.id;
        const brandInfo = getBrandInfo(item.station.brand);

        let pinClasses = "bg-white text-slate-900 border-slate-300 shadow-md";
        let brandTagBg = brandInfo.primaryColor;
        let brandTagText = "#ffffff";
        let zIndex = 500 - index;

        if (isBest) {
          pinClasses =
            "bg-[#00D97E] text-slate-950 font-black border-[#00B86B] shadow-xl shadow-[#00D97E]/30 scale-105 ring-2 ring-[#00D97E]/40";
          brandTagBg = "#000000";
          brandTagText = "#00D97E";
          zIndex = 1500;
        } else if (isSelected) {
          pinClasses =
            "bg-[#0075FF] text-white font-black border-[#0060d0] shadow-xl shadow-[#0075FF]/30 scale-105 ring-2 ring-[#0075FF]/40";
          brandTagBg = "#ffffff";
          brandTagText = "#0075FF";
          zIndex = 1600;
        }

        const iconHtml = `
          <div class="cursor-pointer transform transition-all hover:scale-125 hover:z-[9999]">
            <div class="flex flex-col items-center">
              <div class="px-2 py-0.5 rounded-full text-[11px] font-extrabold border flex items-center gap-1 whitespace-nowrap ${pinClasses}">
                <span class="text-[8.5px] font-black uppercase px-1 rounded-full" style="background-color: ${brandTagBg}; color: ${brandTagText};">
                  ${brandInfo.logoText.slice(0, 6)}
                </span>
                <span>${item.finalPrice.toFixed(3)} €</span>
              </div>
              <div class="w-1.5 h-1.5 rotate-45 -mt-0.5 border-r border-b ${pinClasses}"></div>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: "station-price-pin",
          html: iconHtml,
          iconSize: [68, 28],
          iconAnchor: [34, 28],
        });

        const marker = L.marker(
          [item.station.latitude, item.station.longitude],
          {
            icon: customIcon,
            zIndexOffset: zIndex,
          },
        ).addTo(markersGroupRef.current!);

        markersMapRef.current.set(item.station.id, marker);

        const popupContent = `
          <div class="p-3 min-w-[230px] text-white">
            <div class="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full" style="background-color: ${brandInfo.primaryColor}; color: #ffffff;">
                  ${brandInfo.name}
                </span>
              </div>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${
                item.isOpenNow
                  ? "bg-[#00D97E]/15 text-[#00D97E]"
                  : "bg-rose-500/15 text-rose-400"
              }">
                ${item.isOpenNow ? "Abierto" : "Cerrado"}
              </span>
            </div>
            <p class="text-xs text-zinc-400 mb-3">${item.station.address}</p>
            <div class="bg-black/60 p-2.5 rounded-xl border border-white/10 mb-3">
              <div class="flex justify-between text-xs text-zinc-400">
                <span>Oficial surtidor:</span>
                <span class="${item.discountPerLiter > 0 ? "line-through text-zinc-400" : "text-white font-bold"}">${item.officialPrice.toFixed(3)} €/L</span>
              </div>
              <div class="flex justify-between text-sm font-black text-[#00D97E] mt-0.5">
                <span>Para ti:</span>
                <span>${item.finalPrice.toFixed(3)} €/L</span>
              </div>
              ${
                item.discountPerLiter > 0
                  ? `<div class="text-[11px] text-[#00D97E] font-medium mt-1">-${item.discountPerLiter.toFixed(3)} €/L (${item.appliedDiscountName || "Descuento"})</div>`
                  : ""
              }
            </div>
            <div class="flex items-center justify-between text-xs font-bold text-zinc-300 mb-3.5">
              <span>Depósito (${item.tankCostFinal} €)</span>
            </div>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=${item.station.latitude},${item.station.longitude}"
              target="_blank"
              rel="noopener noreferrer"
              style="color: #ffffff !important; background-color: #0075FF !important; text-decoration: none !important;"
              class="block w-full text-center text-white font-black text-xs py-2.5 px-4 rounded-full shadow-lg transition-transform hover:scale-[1.02]"
            >
              Cómo llegar (${item.distanceKm} km) ↗
            </a>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on("click", () => {
          onSelectStation(item.station.id);
        });
      });

      // Bounds fit for fuel stations
      if (stations.length > 0 && !selectedStationId) {
        const bounds = L.latLngBounds(
          stations.map(
            (s) =>
              [s.station.latitude, s.station.longitude] as [number, number],
          ),
        );
        if (userLat && userLng) bounds.extend([userLat, userLng]);
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [35, 35],
          maxZoom: 14,
        });
      }
    } else {
      // ⚡ EV Charging Station Markers
      evStations.forEach((item, index) => {
        const isBest = index === 0;
        const isSelected = selectedStationId === item.station.id;
        const isUltra = item.station.maxPowerKw >= 150;

        let pinClasses = isUltra
          ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-black border-cyan-400 font-black shadow-cyan-500/30"
          : "bg-cyan-950 text-cyan-200 border-cyan-500/40 shadow-md";
        let zIndex = 600 - index;

        if (isBest) {
          pinClasses =
            "bg-[#00D97E] text-black font-black border-[#00B86B] shadow-xl shadow-[#00D97E]/40 scale-110 ring-2 ring-cyan-400";
          zIndex = 1700;
        } else if (isSelected) {
          pinClasses =
            "bg-white text-black font-black border-cyan-400 shadow-xl scale-110 ring-2 ring-cyan-500";
          zIndex = 1800;
        }

        const iconHtml = `
          <div class="cursor-pointer transform transition-all hover:scale-125 hover:z-[9999]">
            <div class="flex flex-col items-center">
              <div class="px-2 py-0.5 rounded-full text-[11px] font-extrabold border flex items-center gap-1 whitespace-nowrap shadow-lg ${pinClasses}">
                <span class="text-[10px]">⚡</span>
                <span>${item.effectivePricePerKwh.toFixed(2)} €/kWh</span>
              </div>
              <div class="w-1.5 h-1.5 rotate-45 -mt-0.5 border-r border-b ${pinClasses}"></div>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: "ev-station-pin",
          html: iconHtml,
          iconSize: [80, 28],
          iconAnchor: [40, 28],
        });

        const marker = L.marker(
          [item.station.latitude, item.station.longitude],
          {
            icon: customIcon,
            zIndexOffset: zIndex,
          },
        ).addTo(markersGroupRef.current!);

        markersMapRef.current.set(item.station.id, marker);

        const connectorsHtml = item.station.connectors
          .map(
            (c) =>
              `<span class="inline-block bg-white/10 px-1.5 py-0.5 rounded text-[10px] mr-1 mb-1">${c.type} (${c.availableCount}/${c.totalCount})</span>`,
          )
          .join("");

        const popupContent = `
          <div class="p-3 min-w-[240px] text-white">
            <div class="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
              <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                ${item.station.operatorName}
              </span>
              <span class="text-[10px] font-black text-cyan-400">⚡ ${item.station.maxPowerKw} kW</span>
            </div>
            <h4 class="text-xs font-bold text-white mb-1">${item.station.name}</h4>
            <p class="text-[11px] text-zinc-400 mb-2.5">${item.station.address}</p>

            <div class="bg-black/60 p-2.5 rounded-xl border border-white/10 mb-3 space-y-1">
              <div class="flex justify-between text-xs text-zinc-300">
                <span>Precio:</span>
                <span class="font-black text-[#00D97E] text-sm">${item.effectivePricePerKwh.toFixed(2)} €/kWh</span>
              </div>
              <div class="flex justify-between text-[11px] text-zinc-400">
                <span>Carga estimada (${item.sessionKwh} kWh):</span>
                <span class="font-bold text-white">${item.sessionCostEffective.toFixed(2)} €</span>
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

      // Bounds fit for EV stations
      if (evStations.length > 0 && !selectedStationId) {
        const bounds = L.latLngBounds(
          evStations.map(
            (s) =>
              [s.station.latitude, s.station.longitude] as [number, number],
          ),
        );
        if (userLat && userLng) bounds.extend([userLat, userLng]);
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [35, 35],
          maxZoom: 14,
        });
      }
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
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
}
