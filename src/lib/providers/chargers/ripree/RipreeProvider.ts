import { ChargerQueryFilter, NormalizedCharger } from "@/lib/types/charger";
import { ChargerProvider } from "../ChargerProvider";
import { RipreeMitecoProvider } from "../RipreeMitecoProvider";

export class RipreeProvider implements ChargerProvider {
  private baseProvider = new RipreeMitecoProvider();

  public getProviderName(): string {
    return "RIPREE_MITECO";
  }

  public async syncLocations(): Promise<NormalizedCharger[]> {
    return this.baseProvider.syncLocations();
  }

  public async getChargersNear(
    filter: ChargerQueryFilter,
  ): Promise<NormalizedCharger[]> {
    return this.baseProvider.getChargersNear(filter);
  }
}
