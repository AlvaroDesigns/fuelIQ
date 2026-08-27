import {
  ChargerQueryFilter,
  ChargerStatus,
  NormalizedCharger,
} from "@/lib/types/charger";
import { ChargerProvider } from "../ChargerProvider";
import { OcpiProvider as BaseOcpi } from "../OcpiProvider";

export class OcpiAdapter implements ChargerProvider {
  public getProviderName(): string {
    return "OCPI";
  }

  public async syncLocations(): Promise<NormalizedCharger[]> {
    // Connects to OCPI 2.2.1 /locations endpoint
    return [];
  }

  public async syncStatus(
    chargerIds: string[],
  ): Promise<Map<string, { status: ChargerStatus; lastUpdated: string }>> {
    const statusMap = await BaseOcpi.fetchEVSEStatus(chargerIds);
    const result = new Map<
      string,
      { status: ChargerStatus; lastUpdated: string }
    >();

    statusMap.forEach((status, id) => {
      result.set(id, { status, lastUpdated: new Date().toISOString() });
    });

    return result;
  }

  public async getChargersNear(
    filter: ChargerQueryFilter,
  ): Promise<NormalizedCharger[]> {
    return [];
  }
}
