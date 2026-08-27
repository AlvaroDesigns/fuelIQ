import { ChargerAggregator } from './chargers/ChargerAggregator';
import { EVConnector, EVStation } from '../types/ev';
import { NormalizedCharger } from '../types/charger';

const aggregator = new ChargerAggregator();

export class EVStationProvider {
  /**
   * Helper to determine EVStation operator enum from NormalizedCharger operator
   */
  public static mapOperatorToEVType(operatorId: string): EVStation['operator'] {
    switch (operatorId.toLowerCase()) {
      case 'tesla':
        return 'TESLA';
      case 'ionity':
        return 'IONITY';
      case 'zunder':
        return 'ZUNDER';
      case 'iberdrola':
        return 'IBERDROLA';
      case 'endesa':
        return 'ENDESA_X';
      case 'repsol':
        return 'REPSOL_EV';
      case 'wenea':
        return 'WENEA';
      case 'powerdot':
        return 'POWERDOT';
      default:
        return 'OTHER';
    }
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

    const op = `${tags.operator || ''} ${tags.brand || ''}`.toUpperCase();
    if (op.includes('IONITY')) return 350;
    if (op.includes('TESLA')) return 250;
    if (op.includes('ZUNDER')) return 300;
    if (op.includes('IBERDROLA') && op.includes('PULSE')) return 180;
    if (op.includes('ENDESA')) return 150;
    if (op.includes('REPSOL')) return 150;

    return 22;
  }

  /**
   * Fetch LIVE EV stations from ChargerAggregator (MITECO + Google + OSM + OCPI)
   */
  public static async fetchLiveEVStations(
    lat: number,
    lng: number,
    radiusKm: number = 25
  ): Promise<EVStation[]> {
    const response = await aggregator.getChargers({
      lat,
      lng,
      radiusKm,
    });

    return response.chargers.map((c: NormalizedCharger) => {
      const connectors: EVConnector[] = [];

      c.evses.forEach((evse) => {
        evse.connectors.forEach((con) => {
          connectors.push({
            type:
              con.type === 'CCS'
                ? 'CCS2'
                : con.type === 'TESLA'
                ? 'TESLA_SUPERCHARGER'
                : con.type === 'CHADEMO'
                ? 'CHADEMO'
                : 'TYPE_2',
            label: `${con.type} ${con.powerKw ? `${con.powerKw}kW` : ''}`,
            maxPowerKw: con.powerKw || c.powerKw || 22,
            totalCount: 1,
            availableCount: con.status === 'AVAILABLE' ? 1 : 0,
            currentType: con.type === 'TYPE_2' ? 'AC' : 'DC',
          });
        });
      });

      if (connectors.length === 0) {
        connectors.push({
          type: c.powerKw >= 50 ? 'CCS2' : 'TYPE_2',
          label: c.powerKw >= 50 ? 'CCS2 Combo' : 'Tipo 2 Mennekes',
          maxPowerKw: c.powerKw || 22,
          totalCount: 2,
          availableCount: 2,
          currentType: c.powerKw >= 50 ? 'DC' : 'AC',
        });
      }

      return {
        id: c.id,
        operator: this.mapOperatorToEVType(c.operator.id),
        operatorName: c.operator.name,
        name: c.name,
        address: c.address.street || 'Vía pública / Parking',
        locality: c.address.city || 'España',
        municipality: c.address.city || 'España',
        province: c.address.province || 'España',
        postalCode: c.address.postalCode || '',
        latitude: c.location.latitude,
        longitude: c.location.longitude,
        schedule: c.schedule || 'L-D: 24 Horas',
        maxPowerKw: c.powerKw,
        pricePerKwh: c.pricing?.pricePerKwh || 0.45,
        memberPricePerKwh: c.pricing?.memberPricePerKwh,
        isOpen24h: c.isOpen24h ?? true,
        connectors,
        amenities: c.amenities || ['Punto Público', 'Acceso App'],
      };
    });
  }
}
