import { ChargerProvider } from '../ChargerProvider';
import { NormalizedCharger, ChargerQueryFilter } from '@/lib/types/charger';
import { RipreeMitecoProvider } from '../RipreeMitecoProvider';
import { DiscountEngine } from '@/lib/engine/discount-calculator';

export class GooglePlacesProvider implements ChargerProvider {
  private static API_URL = 'https://places.googleapis.com/v1/places:searchNearby';

  public getProviderName(): string {
    return 'GOOGLE';
  }

  public async syncLocations(): Promise<NormalizedCharger[]> {
    return [];
  }

  /**
   * Search EV charging stations using Google Places API v1 (SearchNearby)
   */
  public async getChargersNear(filter: ChargerQueryFilter): Promise<NormalizedCharger[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    const { lat, lng, radiusKm } = filter;

    if (!apiKey) {
      // In development without direct Google Places key, return empty list safely
      return [];
    }

    try {
      const radiusMeters = Math.min(radiusKm * 1000, 50000);
      const response = await fetch(GooglePlacesProvider.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.location,places.evChargeOptions',
        },
        body: JSON.stringify({
          includedTypes: ['electric_vehicle_charging_station'],
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: radiusMeters,
            },
          },
          rankPreference: 'DISTANCE',
        }),
      });

      if (!response.ok) {
        console.warn(`[GooglePlacesProvider] Status ${response.status}`);
        return [];
      }

      const data = await response.json();
      const places = data.places || [];

      return places.map((p: any) => {
        const name = p.displayName?.text || 'Punto de recarga Google';
        const operatorInfo = RipreeMitecoProvider.normalizeOperator(name);
        const pricing = RipreeMitecoProvider.getOperatorPricing(operatorInfo.id, 50);

        return {
          id: `google-${p.id}`,
          externalIds: [{ source: 'GOOGLE', id: p.id }],
          operator: operatorInfo,
          name,
          location: {
            latitude: p.location?.latitude || lat,
            longitude: p.location?.longitude || lng,
          },
          address: {
            street: p.formattedAddress || '',
            city: 'España',
            country: 'ES',
          },
          powerKw: 50,
          isUltraFast: false,
          isFast: true,
          status: 'AVAILABLE',
          confidenceScore: 70,
          evses: [
            {
              id: `evse-google-${p.id}`,
              status: 'AVAILABLE',
              connectors: [
                { id: `c-g-${p.id}`, type: 'CCS', powerKw: 50, status: 'AVAILABLE' },
              ],
            },
          ],
          sources: ['GOOGLE'],
          sourceRecords: [
            {
              source: 'GOOGLE',
              externalId: p.id,
              lastSeen: new Date().toISOString(),
            },
          ],
          pricing: {
            pricePerKwh: pricing.pricePerKwh,
            memberPricePerKwh: pricing.memberPricePerKwh,
            currency: 'EUR',
          },
          lastUpdated: new Date().toISOString(),
        };
      });
    } catch (err) {
      console.warn('[GooglePlacesProvider] Error querying Google Places API:', err);
      return [];
    }
  }
}
