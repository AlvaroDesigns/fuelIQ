import { ChargerStatus } from "@/lib/types/charger";

export interface OcpiSessionToken {
  token: string;
  expiresAt: string;
}

export class OcpiProvider {
  private static PROVIDER_NAME = "OCPI";

  /**
   * Normalize standard OCPI status
   */
  public static mapOcpiStatus(rawStatus?: string): ChargerStatus {
    switch (rawStatus?.toUpperCase()) {
      case "AVAILABLE":
      case "FREE":
        return "AVAILABLE";
      case "OCCUPIED":
      case "CHARGING":
      case "RESERVED":
        return "OCCUPIED";
      case "OUTOFORDER":
      case "OUT_OF_ORDER":
      case "INOPERATIVE":
      case "BLOCKED":
        return "OUT_OF_ORDER";
      default:
        return "UNKNOWN";
    }
  }

  /**
   * Fetch dynamic status for EVSEs via standard OCPI 2.2.1 endpoint
   */
  public static async fetchEVSEStatus(
    evseIds: string[],
  ): Promise<Map<string, ChargerStatus>> {
    const statusMap = new Map<string, ChargerStatus>();

    // Simulating active OCPI polling / webhook responses for EVSE status
    evseIds.forEach((id) => {
      statusMap.set(id, "AVAILABLE");
    });

    return statusMap;
  }
}
