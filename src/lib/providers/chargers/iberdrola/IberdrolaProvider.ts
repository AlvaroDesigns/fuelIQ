import { ChargerQueryFilter, NormalizedCharger } from "@/lib/types/charger";
import { ChargerProvider } from "../ChargerProvider";

export class IberdrolaProvider implements ChargerProvider {
  public getProviderName(): string {
    return "IBERDROLA";
  }

  public async syncLocations(): Promise<NormalizedCharger[]> {
    return [];
  }

  public async getChargersNear(
    filter: ChargerQueryFilter,
  ): Promise<NormalizedCharger[]> {
    return [];
  }
}
