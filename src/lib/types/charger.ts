// EV Charger Aggregator - Normalized Multi-Source Domain Types

export type ChargerStatus = 'AVAILABLE' | 'OCCUPIED' | 'OUT_OF_ORDER' | 'UNKNOWN';

export type NormalizedConnectorType = 'CCS' | 'TYPE_2' | 'CHADEMO' | 'TESLA' | 'TYPE_1' | 'SCHUKO' | 'OTHER';

export type SourceType = 'MITECO' | 'GOOGLE' | 'OSM' | 'OCPI' | 'OPERATOR' | 'CACHED';

export interface ChargerSourceRecord {
  source: SourceType;
  externalId: string;
  lastSeen: string;
}

export interface ChargerConfidence {
  score: number;
  sources: SourceType[];
  verified: boolean;
}

export interface NormalizedConnector {
  id: string;
  type: NormalizedConnectorType;
  format?: 'CABLE' | 'SOCKET';
  powerKw?: number;
  voltage?: number;
  amperage?: number;
  status?: ChargerStatus;
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
  externalId?: string;
  externalIds?: { source: string; id: string }[];
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
    street?: string;
    city?: string;
    postalCode?: string;
    province?: string;
    country?: string;
  };
  powerKw: number;
  distanceKm?: number;
  status?: ChargerStatus;
  confidenceScore?: number;
  isUltraFast: boolean; // >= 150 kW
  isFast: boolean;      // 50-149 kW
  evses: NormalizedEVSE[];
  sources?: SourceType[];
  source?: {
    type: string;
    lastUpdated: string;
  };
  sourceRecords?: ChargerSourceRecord[];
  pricing?: {
    pricePerKwh: number;
    memberPricePerKwh?: number;
    currency: string;
  };
  schedule?: string;
  isOpen24h?: boolean;
  amenities?: string[];
  lastUpdated?: string;
}

export interface ChargerQueryFilter {
  lat: number;
  lng: number;
  radiusKm: number;
  minPowerKw?: number;
  maxPowerKw?: number;
  connector?: NormalizedConnectorType | 'ALL';
  operator?: string | 'ALL';
  status?: ChargerStatus | 'ALL';
  limit?: number;
}

export interface ChargerApiResponse {
  count: number;
  updatedAt: string;
  chargers: NormalizedCharger[];
}
