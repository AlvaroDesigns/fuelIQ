import { NormalizedCharger, ChargerQueryFilter } from '@/lib/types/charger';

export interface ChargerProvider {
  getProviderName(): string;
  syncLocations(): Promise<NormalizedCharger[]>;
  syncStatus?(chargerIds: string[]): Promise<Map<string, { status: any; lastUpdated: string }>>;
  getChargersNear(filter: ChargerQueryFilter): Promise<NormalizedCharger[]>;
}
