import { ChargerQueryFilter, NormalizedCharger } from "@/lib/types/charger";
import { ChargerProvider } from "../ChargerProvider";

export class TeslaProvider implements ChargerProvider {
  public getProviderName(): string {
    return "TESLA";
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
