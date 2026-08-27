import { ChargerProvider } from './ChargerProvider';
import { RipreeProvider } from './ripree/RipreeProvider';
import { GooglePlacesProvider } from './google/GooglePlacesProvider';
import { OsmProvider } from './osm/OsmProvider';
import { OcpiAdapter } from './ocpi/OcpiProvider';
import { EndesaProvider } from './endesa/EndesaProvider';
import { IberdrolaProvider } from './iberdrola/IberdrolaProvider';
import { TeslaProvider } from './tesla/TeslaProvider';
import { RepsolProvider } from './repsol/RepsolProvider';
import { ChargerMatcher } from './charger.matcher';
import { NormalizedCharger, ChargerQueryFilter, ChargerApiResponse } from '@/lib/types/charger';
import { DiscountEngine } from '@/lib/engine/discount-calculator';

const memoryCache = new Map<string, { timestamp: number; data: NormalizedCharger[] }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export class ChargerAggregator {
  private providers: ChargerProvider[];
  private ocpiAdapter: OcpiAdapter;

  constructor() {
    this.providers = [
      new RipreeProvider(),
      new GooglePlacesProvider(),
      new OsmProvider(),
      new EndesaProvider(),
      new IberdrolaProvider(),
      new TeslaProvider(),
      new RepsolProvider(),
    ];
    this.ocpiAdapter = new OcpiAdapter();
  }

  /**
   * Query chargers near coordinates with Multi-Source Aggregation (MITECO + Google + OSM + OCPI + Operators)
   */
  public async getChargers(filter: ChargerQueryFilter): Promise<ChargerApiResponse> {
    const { lat, lng, radiusKm, minPowerKw, maxPowerKw, connector, operator, status, limit } = filter;

    const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}_${radiusKm}_${minPowerKw || 0}_${maxPowerKw || 0}_${connector || 'ALL'}_${operator || 'ALL'}_${status || 'ALL'}`;
    const cached = memoryCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      let cachedList = cached.data;
      if (limit && limit > 0) cachedList = cachedList.slice(0, limit);
      return {
        count: cachedList.length,
        updatedAt: new Date(cached.timestamp).toISOString(),
        chargers: cachedList,
      };
    }

    // 1. Concurrently fetch candidates from all registered discovery & inventory providers with error isolation
    const rawCandidates: NormalizedCharger[] = [];

    await Promise.allSettled(
      this.providers.map(async (provider) => {
        try {
          const results = await provider.getChargersNear(filter);
          rawCandidates.push(...results);
        } catch (err) {
          console.warn(`[ChargerAggregator] Provider ${provider.getProviderName()} error:`, err);
        }
      })
    );

    // 2. Perform intelligent multi-source matching and spatial deduplication
    let processedChargers = ChargerMatcher.mergeAndDeduplicate(rawCandidates);

    // 3. Enrich EVSE dynamic status via OCPI Verification Layer
    const evseIds = processedChargers.flatMap((c) => c.evses.map((e) => e.id));
    if (evseIds.length > 0) {
      try {
        const statusMap = await this.ocpiAdapter.syncStatus(evseIds);
        processedChargers = processedChargers.map((c) => {
          const updatedEvses = c.evses.map((e) => {
            const dynamicInfo = statusMap.get(e.id);
            return {
              ...e,
              status: dynamicInfo ? dynamicInfo.status : e.status,
              lastUpdated: dynamicInfo ? dynamicInfo.lastUpdated : e.lastUpdated,
            };
          });

          // Overall charger status based on EVSEs
          const isAnyAvailable = updatedEvses.some((e) => e.status === 'AVAILABLE');
          return {
            ...c,
            status: isAnyAvailable ? 'AVAILABLE' : updatedEvses[0]?.status || c.status,
            evses: updatedEvses,
          };
        });
      } catch (err) {
        console.warn('[ChargerAggregator] OCPI status verification error:', err);
      }
    }

    // 4. Calculate exact distance and apply user query filters
    processedChargers = processedChargers
      .map((c) => {
        const distance = DiscountEngine.calculateDistanceKm(
          lat,
          lng,
          c.location.latitude,
          c.location.longitude
        );
        return {
          ...c,
          distanceKm: Math.round(distance * 10) / 10,
        };
      })
      .filter((c) => {
        if ((c.distanceKm ?? 0) > radiusKm) return false;
        if (minPowerKw && c.powerKw < minPowerKw) return false;
        if (maxPowerKw && c.powerKw > maxPowerKw) return false;
        if (operator && operator !== 'ALL' && c.operator.id !== operator.toLowerCase()) return false;
        if (status && status !== 'ALL' && c.status !== status) return false;
        if (connector && connector !== 'ALL') {
          const matchConn = c.evses.some((e) =>
            e.connectors.some((con) => con.type === connector)
          );
          if (!matchConn) return false;
        }
        return true;
      });

    // 5. Sort by distance
    processedChargers.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

    // 6. Cache full result
    memoryCache.set(cacheKey, { timestamp: Date.now(), data: processedChargers });

    const finalResults = limit && limit > 0 ? processedChargers.slice(0, limit) : processedChargers;

    return {
      count: finalResults.length,
      updatedAt: new Date().toISOString(),
      chargers: finalResults,
    };
  }

  /**
   * Background Synchronization worker (runs via Cron for static inventory update)
   */
  public async syncInventory(): Promise<{ syncedCount: number; timestamp: string }> {
    let count = 0;
    for (const provider of this.providers) {
      try {
        const locations = await provider.syncLocations();
        count += locations.length;
      } catch (err) {
        console.error(`[ChargerAggregator] Sync failed for ${provider.getProviderName()}:`, err);
      }
    }
    return {
      syncedCount: count,
      timestamp: new Date().toISOString(),
    };
  }
}
