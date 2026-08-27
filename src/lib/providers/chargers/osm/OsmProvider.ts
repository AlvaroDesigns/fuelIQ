import { ChargerQueryFilter, NormalizedCharger } from "@/lib/types/charger";
import { ChargerProvider } from "../ChargerProvider";
import { RipreeMitecoProvider } from "../RipreeMitecoProvider";
import { parseEVMaxPower } from "@/lib/utils/ev-power-parser";

export class OsmProvider implements ChargerProvider {
  private static OVERPASS_MIRRORS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
  ];

  public getProviderName(): string {
    return "OSM";
  }

  public async syncLocations(): Promise<NormalizedCharger[]> {
    return [];
  }

  /**
   * Search EV charging stations using OpenStreetMap Overpass API
   */
  public async getChargersNear(
    filter: ChargerQueryFilter,
  ): Promise<NormalizedCharger[]> {
    const { lat, lng, radiusKm } = filter;
    const radiusMeters = Math.min(Math.max(radiusKm * 1000, 15000), 50000);
    const query = `[out:json][timeout:8];(
      node["amenity"="charging_station"](around:${radiusMeters},${lat},${lng});
      way["amenity"="charging_station"](around:${radiusMeters},${lat},${lng});
      node["socket:type2"](around:${radiusMeters},${lat},${lng});
      way["socket:type2"](around:${radiusMeters},${lat},${lng});
      node["socket:type2_combo"](around:${radiusMeters},${lat},${lng});
      way["socket:type2_combo"](around:${radiusMeters},${lat},${lng});
      node["charging_station"](around:${radiusMeters},${lat},${lng});
      way["charging_station"](around:${radiusMeters},${lat},${lng});
    );out center body 200;`;

    for (const mirror of OsmProvider.OVERPASS_MIRRORS) {
      try {
        const url = `${mirror}?data=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": "FuelIQ-App/1.0 (Spain Multi-Source EV Aggregator)",
            Accept: "application/json",
          },
          next: { revalidate: 300 },
        });

        if (!response.ok) continue;

        const json = await response.json();
        const elements: any[] = json.elements || [];
        if (elements.length === 0) continue;

        return elements
          .filter((el) => el.lat || el.center?.lat)
          .map((el) => {
            const latitude = el.lat || el.center?.lat;
            const longitude = el.lon || el.center?.lon;
            const tags = el.tags || {};

            const operatorInfo = RipreeMitecoProvider.normalizeOperator(
              tags.operator || tags.brand || tags.name || "",
            );

            const maxPowerKw = parseEVMaxPower(tags);
            const pricing = RipreeMitecoProvider.getOperatorPricing(
              operatorInfo.id,
              maxPowerKw,
            );

            const name =
              tags.name ||
              (tags.operator
                ? `${tags.operator} Punto de Recarga`
                : tags.brand
                ? `${tags.brand} Punto de Recarga`
                : "Punto de Recarga EV");

            return {
              id: `osm-${el.id}`,
              externalIds: [{ source: "OSM", id: String(el.id) }],
              operator: operatorInfo,
              name,
              location: { latitude, longitude },
              address: {
                street: tags["addr:street"] || tags.description || "",
                city: tags["addr:city"] || "España",
                postalCode: tags["addr:postcode"] || "",
                country: "ES",
              },
              powerKw: maxPowerKw,
              isUltraFast: maxPowerKw >= 150,
              isFast: maxPowerKw >= 50 && maxPowerKw < 150,
              status: "AVAILABLE",
              confidenceScore: 65,
              evses: [
                {
                  id: `evse-osm-${el.id}`,
                  status: "AVAILABLE",
                  connectors: [
                    {
                      id: `c-osm-${el.id}`,
                      type: maxPowerKw >= 50 ? "CCS" : "TYPE_2",
                      powerKw: maxPowerKw,
                      status: "AVAILABLE",
                    },
                  ],
                },
              ],
              sources: ["OSM"],
              sourceRecords: [
                {
                  source: "OSM",
                  externalId: String(el.id),
                  lastSeen: new Date().toISOString(),
                },
              ],
              pricing: {
                pricePerKwh: pricing.pricePerKwh,
                memberPricePerKwh: pricing.memberPricePerKwh,
                currency: "EUR",
              },
              schedule: tags.opening_hours || "L-D: 24 Horas",
              isOpen24h: tags.opening_hours?.includes("24/7") ?? true,
              lastUpdated: new Date().toISOString(),
            };
          });
      } catch (err) {
        console.warn(`[OsmProvider] Mirror ${mirror} error, trying next:`, err);
      }
    }

    return [];
  }
}
