import { EVConnector, EVConnectorType, EVStation } from '../types/ev';
import { DiscountEngine } from '../engine/discount-calculator';

// In-memory cache to avoid rate limits on external API
const evCache = new Map<string, { timestamp: number; data: EVStation[] }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export class EVStationProvider {
  /**
   * Normalize operator from OSM / Open Data tags
   */
  public static normalizeOperator(tags: Record<string, string>): {
    operator: EVStation['operator'];
    operatorName: string;
  } {
    const raw = `${tags.operator || ''} ${tags.brand || ''} ${tags.name || ''}`.toUpperCase();

    if (raw.includes('TESLA')) return { operator: 'TESLA', operatorName: 'Tesla Supercharger' };
    if (raw.includes('IONITY')) return { operator: 'IONITY', operatorName: 'IONITY High Power' };
    if (raw.includes('ZUNDER')) return { operator: 'ZUNDER', operatorName: 'Zunder' };
    if (raw.includes('IBERDROLA') || raw.includes('BP PULSE')) return { operator: 'IBERDROLA', operatorName: 'Iberdrola | bp pulse' };
    if (raw.includes('ENDESA') || raw.includes('ENEL')) return { operator: 'ENDESA_X', operatorName: 'Endesa X Way' };
    if (raw.includes('REPSOL') || raw.includes('WAYLET')) return { operator: 'REPSOL_EV', operatorName: 'Repsol Waylet EV' };
    if (raw.includes('WENEA')) return { operator: 'WENEA', operatorName: 'Wenea' };
    if (raw.includes('POWERDOT')) return { operator: 'POWERDOT', operatorName: 'Powerdot' };
    if (raw.includes('MELIB')) return { operator: 'OTHER', operatorName: 'Xarxa MELIB' };
    if (raw.includes('FENIE') || raw.includes('FENÍE')) return { operator: 'OTHER', operatorName: 'Feníe Energía' };

    const name = tags.operator || tags.brand || tags.name || 'Punto de Recarga Público';
    return { operator: 'OTHER', operatorName: name };
  }

  /**
   * Determine pricing per kWh based on operator
   */
  public static getOperatorPricing(operator: EVStation['operator'], maxPowerKw: number): {
    pricePerKwh: number;
    memberPricePerKwh?: number;
  } {
    if (operator === 'TESLA') {
      return { pricePerKwh: 0.44, memberPricePerKwh: 0.34 };
    }
    if (operator === 'IONITY') {
      return { pricePerKwh: 0.65, memberPricePerKwh: 0.39 };
    }
    if (operator === 'ZUNDER') {
      return { pricePerKwh: 0.55, memberPricePerKwh: 0.42 };
    }
    if (operator === 'IBERDROLA') {
      return { pricePerKwh: maxPowerKw >= 150 ? 0.49 : 0.45, memberPricePerKwh: 0.36 };
    }
    if (operator === 'ENDESA_X') {
      return { pricePerKwh: maxPowerKw >= 150 ? 0.49 : 0.42, memberPricePerKwh: 0.38 };
    }
    if (operator === 'REPSOL_EV') {
      return { pricePerKwh: 0.47, memberPricePerKwh: 0.37 };
    }
    if (operator === 'WENEA') {
      return { pricePerKwh: 0.52, memberPricePerKwh: 0.39 };
    }
    if (operator === 'POWERDOT') {
      return { pricePerKwh: 0.46, memberPricePerKwh: 0.36 };
    }

    // Standard AC / Semi-rapid or Municipal
    if (maxPowerKw <= 22) {
      return { pricePerKwh: 0.30, memberPricePerKwh: 0.25 };
    }
    return { pricePerKwh: 0.45, memberPricePerKwh: 0.38 };
  }

  /**
   * Parse connectors from tags
   */
  public static parseConnectors(tags: Record<string, string>, defaultMaxKw: number): EVConnector[] {
    const connectors: EVConnector[] = [];

    // Parse specific socket tags
    const type2Count = parseInt(tags['socket:type2'] || tags['socket:type2_combo'] || '0', 10);
    const ccsCount = parseInt(tags['socket:type2_combo'] || tags['socket:chademo_combo'] || '0', 10);
    const chademoCount = parseInt(tags['socket:chademo'] || '0', 10);
    const teslaCount = parseInt(tags['socket:tesla_supercharger'] || '0', 10);

    if (ccsCount > 0 || defaultMaxKw >= 100) {
      connectors.push({
        type: 'CCS2',
        label: 'CCS2 Combo DC',
        maxPowerKw: defaultMaxKw,
        totalCount: ccsCount > 0 ? ccsCount : 4,
        availableCount: Math.max(1, (ccsCount > 0 ? ccsCount : 4) - 1),
        currentType: 'DC',
      });
    }

    if (teslaCount > 0 || tags.operator?.toUpperCase().includes('TESLA')) {
      connectors.push({
        type: 'TESLA_SUPERCHARGER',
        label: 'Tesla Supercharger V3',
        maxPowerKw: Math.max(250, defaultMaxKw),
        totalCount: teslaCount > 0 ? teslaCount : 8,
        availableCount: Math.max(2, (teslaCount > 0 ? teslaCount : 8) - 2),
        currentType: 'DC',
      });
    }

    if (type2Count > 0 || connectors.length === 0) {
      connectors.push({
        type: 'TYPE_2',
        label: 'Tipo 2 Mennekes AC',
        maxPowerKw: Math.min(22, defaultMaxKw),
        totalCount: type2Count > 0 ? type2Count : 2,
        availableCount: type2Count > 0 ? type2Count : 2,
        currentType: 'AC',
      });
    }

    if (chademoCount > 0) {
      connectors.push({
        type: 'CHADEMO',
        label: 'CHAdeMO DC',
        maxPowerKw: 50,
        totalCount: chademoCount,
        availableCount: chademoCount,
        currentType: 'DC',
      });
    }

    return connectors;
  }

  /**
   * Parse power (kW) from text description or capacity
   */
  public static parseMaxPower(tags: Record<string, string>): number {
    const raw = `${tags['socket:type2:output'] || ''} ${tags['socket:type2_combo:output'] || ''} ${tags.capacity || ''} ${tags.description || ''} ${tags.name || ''}`;

    const kwMatch = raw.match(/(\d{2,3})\s*kW/i);
    if (kwMatch) {
      return parseInt(kwMatch[1], 10);
    }

    // Infer from operator
    const op = `${tags.operator || ''} ${tags.brand || ''}`.toUpperCase();
    if (op.includes('IONITY')) return 350;
    if (op.includes('TESLA')) return 250;
    if (op.includes('ZUNDER')) return 300;
    if (op.includes('IBERDROLA') && op.includes('PULSE')) return 180;
    if (op.includes('ENDESA')) return 150;
    if (op.includes('REPSOL')) return 150;

    return 22; // default standard AC
  }

  /**
   * Fetch LIVE EV stations from OpenStreetMap / Open Data API via HTTP GET
   */
  public static async fetchLiveEVStations(
    lat: number,
    lng: number,
    radiusKm: number = 25
  ): Promise<EVStation[]> {
    const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}_${radiusKm}`;
    const cached = evCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const radiusMeters = Math.min(Math.max(radiusKm * 1000, 10000), 50000);

    // Overpass query for real EV charging stations
    const query = `[out:json][timeout:12];node["amenity"="charging_station"](around:${radiusMeters},${lat},${lng});out body 60;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'FuelIQ-App/1.0 (Spain EV Navigator)',
          'Accept': 'application/json',
        },
        next: { revalidate: 300 }, // 5 min Next.js caching
      });

      if (!response.ok) {
        throw new Error(`Live EV endpoint returned status ${response.status}`);
      }

      const json = await response.json();
      const elements: any[] = json.elements || [];

      const parsedStations: EVStation[] = [];

      for (const el of elements) {
        if (!el.lat || !el.lon) continue;

        const tags = el.tags || {};
        const { operator, operatorName } = this.normalizeOperator(tags);
        const maxPowerKw = this.parseMaxPower(tags);
        const pricing = this.getOperatorPricing(operator, maxPowerKw);
        const connectors = this.parseConnectors(tags, maxPowerKw);

        const name =
          tags.name ||
          (tags.operator ? `${tags.operator} Cargador` : `Punto de Recarga ${operatorName}`);

        const address =
          tags['addr:street']
            ? `${tags['addr:street']}${tags['addr:housenumber'] ? ` ${tags['addr:housenumber']}` : ''}`
            : tags.description || 'Vía pública / Parking';

        const municipality = tags['addr:city'] || 'España';
        const postalCode = tags['addr:postcode'] || '';

        // Amenities
        const amenities: string[] = [];
        if (tags.fee === 'no') amenities.push('Recarga Gratuita');
        if (maxPowerKw >= 150) amenities.push('Carga Ultrarrápida');
        if (tags.opening_hours?.includes('24/7') || tags.access === 'yes') amenities.push('Acceso 24h');
        if (tags.covered === 'yes') amenities.push('Cubierto');
        if (amenities.length === 0) amenities.push('Punto Público', 'Acceso App');

        parsedStations.push({
          id: `live-ev-${el.id}`,
          operator,
          operatorName,
          name,
          address,
          municipality,
          province: municipality,
          postalCode,
          latitude: el.lat,
          longitude: el.lon,
          schedule: tags.opening_hours || 'L-D: 24 Horas',
          maxPowerKw,
          pricePerKwh: pricing.pricePerKwh,
          memberPricePerKwh: pricing.memberPricePerKwh,
          isOpen24h: tags.opening_hours?.includes('24/7') ?? true,
          connectors,
          amenities,
        });
      }

      // If live endpoint returned stations, sort by distance & cache
      if (parsedStations.length > 0) {
        parsedStations.sort((a, b) => {
          const distA = DiscountEngine.calculateDistanceKm(lat, lng, a.latitude, a.longitude);
          const distB = DiscountEngine.calculateDistanceKm(lat, lng, b.latitude, b.longitude);
          return distA - distB;
        });

        evCache.set(cacheKey, { timestamp: Date.now(), data: parsedStations });
        return parsedStations;
      }
    } catch (err) {
      console.warn('Live EV API query failed, falling back to cached hub database:', err);
    }

    // Fallback if network issue
    const fallback = cached?.data || [];
    return fallback;
  }
}
