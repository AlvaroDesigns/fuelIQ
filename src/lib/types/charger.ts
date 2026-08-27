// Normalized EV Charger Types according to Technical Specification (RIPREE / MITECO & OCPI 2.2.1)

export type ChargerStatus = 'AVAILABLE' | 'OCCUPIED' | 'OUT_OF_ORDER' | 'UNKNOWN';

export type NormalizedConnectorType = 'CCS' | 'TYPE_2' | 'CHADEMO' | 'TESLA' | 'SCHUKO' | 'OTHER';

export interface NormalizedConnector {
  id: string;
  type: NormalizedConnectorType;
  format?: 'CABLE' | 'SOCKET';
  powerKw: number;
  voltage?: number;
  amperage?: number;
  status: ChargerStatus;
}

export interface NormalizedEVSE {
  id: string;
  externalId?: string;
  status: ChargerStatus;
  connectors: NormalizedConnector[];
  lastUpdated?: string;
}

export interface NormalizedCharger {
  id: string;
  externalId: string;
  operator: {
    id: string;
    name: string;
    rawName?: string;
  };
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address: {
    street: string;
    city: string;
    postalCode: string;
    province?: string;
    country: string;
  };
  powerKw: number;
  isUltraFast: boolean; // >= 150 kW
  isFast: boolean;      // 50-149 kW
  evses: NormalizedEVSE[];
  pricing: {
    pricePerKwh: number;
    memberPricePerKwh?: number;
    currency: string;
  };
  schedule?: string;
  isOpen24h: boolean;
  amenities?: string[];
  distanceKm?: number;
  source: {
    type: 'RIPREE_MITECO' | 'OCPI' | 'OPERATOR_DIRECT' | 'CACHED';
    lastUpdated: string;
  };
}

export interface ChargerQueryFilter {
  lat: number;
  lng: number;
  radiusKm: number;
  minPowerKw?: number;
  connector?: NormalizedConnectorType | 'ALL';
  operator?: string | 'ALL';
  status?: ChargerStatus | 'ALL';
  sortBy?: 'distance' | 'power' | 'price' | 'smartScore';
}

export interface ChargerApiResponse {
  count: number;
  updatedAt: string;
  chargers: NormalizedCharger[];
}
