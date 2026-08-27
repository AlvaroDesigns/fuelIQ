import { ChargerProvider } from '../ChargerProvider';
import { NormalizedCharger, ChargerQueryFilter } from '@/lib/types/charger';

export class EndesaProvider implements ChargerProvider {
  public getProviderName(): string {
    return 'ENDESA';
  }

  public async syncLocations(): Promise<NormalizedCharger[]> {
    return [];
  }

  public async getChargersNear(filter: ChargerQueryFilter): Promise<NormalizedCharger[]> {
    return [];
  }
}
