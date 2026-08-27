// FuelIQ Electric Vehicle (EV) Types & Interfaces

export type EVConnectorType = 'CCS2' | 'TYPE_2' | 'CHADEMO' | 'TESLA_SUPERCHARGER';

export type EVPowerCategory = 'ALL' | 'ULTRARAPID' | 'RAPID' | 'SEMIRAPID' | 'SLOW';

export interface EVConnector {
  type: EVConnectorType;
  label: string;
  maxPowerKw: number; // e.g. 350, 150, 50, 22
  totalCount: number;
  availableCount: number;
  currentType: 'DC' | 'AC';
}

export interface EVStation {
  id: string;
  operator: 'TESLA' | 'IBERDROLA' | 'ENDESA_X' | 'REPSOL_EV' | 'IONITY' | 'ZUNDER' | 'WENEA' | 'POWERDOT' | 'OTHER';
  operatorName: string;
  name: string;
  address: string;
  locality?: string;
  municipality: string;
  province: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  schedule?: string;
  maxPowerKw: number; // Max power across all connectors in kW (e.g. 350)
  pricePerKwh: number; // Base price in €/kWh (e.g. 0.45)
  memberPricePerKwh?: number; // Member subscription price in €/kWh (e.g. 0.32)
  connectors: EVConnector[];
  amenities?: string[]; // e.g. ['Cafetería', 'Wifi', 'Baños', 'Restaurante', 'Parking 24h']
  isOpen24h?: boolean;
}

export interface CalculatedEVStation {
  station: EVStation;
  distanceKm: number;
  officialPricePerKwh: number;
  effectivePricePerKwh: number;
  savingPerKwh: number;
  appliedDiscountName?: string;
  sessionKwh: number; // Amount of energy to charge (e.g. 42 kWh for 10%->80% of a 60kWh battery)
  sessionCostOfficial: number;
  sessionCostEffective: number;
  sessionSaving: number;
  estimatedMinutesToCharge: number; // Estimated charging time based on station power & battery
  travelCostEstimated?: number;
  smartScore?: number;
}

export interface EVFilterParams {
  powerCategory: EVPowerCategory;
  selectedConnectors: EVConnectorType[];
  batteryCapacityKwh: number; // e.g. 60 kWh
  targetChargePercentage: number; // e.g. 70 (meaning 10% -> 80% = 70% of battery)
  selectedOperator?: string;
  maxPricePerKwh?: number;
}
