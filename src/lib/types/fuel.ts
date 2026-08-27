// FuelIQ Core Types and Interfaces

export type FuelType =
  | 'GASOLINA_95_E5'
  | 'GASOLINA_95_E10'
  | 'GASOLINA_98_E5'
  | 'GASOLEO_A'
  | 'GASOLEO_PREMIUM'
  | 'GASOLEO_B'
  | 'GLP'
  | 'GNC'
  | 'GNL'
  | 'HIDROGENO'
  | 'DIESEL_RENOVABLE'
  | 'ADBLUE';

export interface FuelTypeInfo {
  id: FuelType;
  label: string;
  shortLabel: string;
  apiName: string;
  color: string;
  badgeBg: string;
  category: 'gasolina' | 'diesel' | 'gas' | 'eco';
}

export const FUEL_TYPES: Record<FuelType, FuelTypeInfo> = {
  GASOLINA_95_E5: {
    id: 'GASOLINA_95_E5',
    label: 'Gasolina 95 E5',
    shortLabel: 'Sin Plomo 95',
    apiName: 'Precio Gasolina 95 E5',
    color: '#10B981',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
    category: 'gasolina',
  },
  GASOLEO_A: {
    id: 'GASOLEO_A',
    label: 'Gasóleo A habitual',
    shortLabel: 'Diésel / Diésel A',
    apiName: 'Precio Gasoleo A',
    color: '#F59E0B',
    badgeBg: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
    category: 'diesel',
  },
  GASOLINA_98_E5: {
    id: 'GASOLINA_98_E5',
    label: 'Gasolina 98 E5',
    shortLabel: 'Sin Plomo 98',
    apiName: 'Precio Gasolina 98 E5',
    color: '#059669',
    badgeBg: 'bg-emerald-600/10 text-emerald-700 border-emerald-600/20 dark:text-emerald-300',
    category: 'gasolina',
  },
  GASOLEO_PREMIUM: {
    id: 'GASOLEO_PREMIUM',
    label: 'Gasóleo Premium / Óptima',
    shortLabel: 'Diésel Plus',
    apiName: 'Precio Gasoleo Premium',
    color: '#D97706',
    badgeBg: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400',
    category: 'diesel',
  },
  GLP: {
    id: 'GLP',
    label: 'Gases Licuados Petróleo (Autogás)',
    shortLabel: 'GLP / Autogás',
    apiName: 'Precio Gases licuados del petróleo',
    color: '#3B82F6',
    badgeBg: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
    category: 'gas',
  },
  GNC: {
    id: 'GNC',
    label: 'Gas Natural Comprimido',
    shortLabel: 'GNC',
    apiName: 'Precio Gas Natural Comprimido',
    color: '#06B6D4',
    badgeBg: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400',
    category: 'gas',
  },
  GNL: {
    id: 'GNL',
    label: 'Gas Natural Licuado',
    shortLabel: 'GNL',
    apiName: 'Precio Gas Natural Licuado',
    color: '#0284C7',
    badgeBg: 'bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400',
    category: 'gas',
  },
  GASOLINA_95_E10: {
    id: 'GASOLINA_95_E10',
    label: 'Gasolina 95 E10',
    shortLabel: '95 E10',
    apiName: 'Precio Gasolina 95 E10',
    color: '#10B981',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
    category: 'gasolina',
  },
  GASOLEO_B: {
    id: 'GASOLEO_B',
    label: 'Gasóleo B (Agrícola)',
    shortLabel: 'Diésel B',
    apiName: 'Precio Gasoleo B',
    color: '#84CC16',
    badgeBg: 'bg-lime-500/10 text-lime-600 border-lime-500/20 dark:text-lime-400',
    category: 'diesel',
  },
  DIESEL_RENOVABLE: {
    id: 'DIESEL_RENOVABLE',
    label: 'Diésel Renovable HVO',
    shortLabel: 'HVO 100',
    apiName: 'Precio Diésel Renovable',
    color: '#8B5CF6',
    badgeBg: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400',
    category: 'eco',
  },
  HIDROGENO: {
    id: 'HIDROGENO',
    label: 'Hidrógeno',
    shortLabel: 'H2',
    apiName: 'Precio Hidrogeno',
    color: '#6366F1',
    badgeBg: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400',
    category: 'eco',
  },
  ADBLUE: {
    id: 'ADBLUE',
    label: 'AdBlue',
    shortLabel: 'AdBlue',
    apiName: 'Precio Adblue',
    color: '#2563EB',
    badgeBg: 'bg-blue-600/10 text-blue-700 border-blue-600/20 dark:text-blue-300',
    category: 'eco',
  },
};

export type DiscountType = 'FIXED_PER_LITER' | 'PERCENTAGE' | 'CASHBACK_PER_LITER';

export interface DiscountRule {
  id: string;
  name: string;
  brand: string; // "REPSOL", "CEPSA", "BP", "SHELL", "GALP", "ALL", etc.
  description: string;
  discountType: DiscountType;
  value: number; // e.g. 0.10 for €0.10/L or 5 for 5%
  category?: 'card' | 'coupon' | 'plan'; // Category for Waylet/Revolut tabs
  applicableFuels?: FuelType[]; // Specific fuel restrictions (e.g. only 98 or Renovable)
  stackable?: boolean; // Can combine/stack with base brand discounts
  expiresAt?: string; // e.g. "Hasta el 15-09-2026"
  maxLiters?: number; // e.g. 60
  tag?: string; // Subtitle or tag
  active: boolean;
  isCustom?: boolean;
}

export interface StationData {
  id: string;
  ministryId: string;
  brand: string;
  rawBrand: string;
  name: string;
  address: string;
  locality?: string | null;
  municipality: string;
  municipalityId?: string | null;
  province: string;
  provinceId?: string | null;
  postalCode: string;
  latitude: number;
  longitude: number;
  schedule?: string | null;
  margin?: string | null;
  saleType?: string | null;
  isActive: boolean;
  lastPriceSync?: Date | string | null;
  prices: Record<string, number>; // fuelType -> price
}

export interface CalculatedStation {
  station: StationData;
  fuelType: FuelType;
  officialPrice: number;
  discountPerLiter: number;
  finalPrice: number;
  savingPerLiter: number;
  appliedDiscountName?: string;
  distanceKm: number;
  tankCostOfficial: number;
  tankCostFinal: number;
  tankSaving: number;
  travelCostEstimated?: number;
  smartScore?: number;
  isOpenNow?: boolean;
}

export interface BestPriceQueryParams {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  fuelType?: FuelType;
  brand?: string;
  province?: string;
  municipality?: string;
  tankLiters?: number;
  sortBy?: 'finalPrice' | 'distance' | 'tankSaving' | 'officialPrice' | 'smartScore';
}
