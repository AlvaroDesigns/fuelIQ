import { NormalizedCharger } from "@/lib/types/charger";
import { ChargerMatcher } from "./charger.matcher";

export class DeduplicationService {
  /**
   * Deduplicate chargers across multiple sources using deterministic scoring and spatial matching
   */
  public static deduplicate(
    chargers: NormalizedCharger[],
  ): NormalizedCharger[] {
    return ChargerMatcher.mergeAndDeduplicate(chargers);
  }
}
