import { NormalizedCharger, SourceType } from '@/lib/types/charger';
import { DiscountEngine } from '@/lib/engine/discount-calculator';

export class ChargerMatcher {
  /**
   * Calculate matching score between two charger candidates [0 - 200]
   */
  public static calculateMatchScore(a: NormalizedCharger, b: NormalizedCharger): number {
    let score = 0;

    // 1. External ID Match
    const aExternal = a.externalIds?.map((x) => x.id) || [];
    const bExternal = b.externalIds?.map((x) => x.id) || [];
    const hasCommonExternalId = aExternal.some((id) => bExternal.includes(id));
    if (hasCommonExternalId) score += 80;

    // 2. Geographic Distance Match
    const distKm = DiscountEngine.calculateDistanceKm(
      a.location.latitude,
      a.location.longitude,
      b.location.latitude,
      b.location.longitude
    );
    const distMeters = distKm * 1000;

    if (distMeters <= 10) {
      score += 40;
    } else if (distMeters <= 35) {
      score += 25;
    } else if (distMeters <= 80) {
      score += 10;
    } else {
      // Greater than 80m -> heavy penalty
      return 0;
    }

    // 3. Operator Match
    if (
      a.operator.id &&
      b.operator.id &&
      a.operator.id !== 'other' &&
      a.operator.id.toLowerCase() === b.operator.id.toLowerCase()
    ) {
      score += 20;
    }

    // 4. Name similarity
    if (a.name && b.name) {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA.includes(nameB) || nameB.includes(nameA)) {
        score += 10;
      }
    }

    return score;
  }

  /**
   * Calculate Confidence Score based on multi-source confirmation
   */
  public static calculateConfidenceScore(sources: SourceType[]): number {
    const hasMiteco = sources.includes('MITECO');
    const hasGoogle = sources.includes('GOOGLE');
    const hasOsm = sources.includes('OSM');
    const hasOcpi = sources.includes('OCPI');
    const hasOperator = sources.includes('OPERATOR');

    if (hasOperator && hasOcpi && hasMiteco) return 100;
    if (hasOcpi || (hasMiteco && hasGoogle && hasOsm)) return 95;
    if (hasMiteco && hasGoogle) return 90;
    if (hasMiteco && hasOsm) return 85;
    if (hasGoogle && hasOsm) return 75;
    if (hasMiteco) return 70;
    if (hasGoogle) return 60;
    return 50; // Single OSM or discovery
  }

  /**
   * Merge and deduplicate chargers from multiple sources
   */
  public static mergeAndDeduplicate(chargers: NormalizedCharger[]): NormalizedCharger[] {
    const merged: NormalizedCharger[] = [];

    for (const candidate of chargers) {
      let bestMatchIndex = -1;
      let highestScore = 0;

      for (let i = 0; i < merged.length; i++) {
        const score = this.calculateMatchScore(merged[i], candidate);
        if (score >= 45 && score > highestScore) {
          highestScore = score;
          bestMatchIndex = i;
        }
      }

      if (bestMatchIndex === -1) {
        // First occurrence
        const candidateSources = candidate.sources || ['MITECO'];
        merged.push({
          ...candidate,
          confidenceScore: this.calculateConfidenceScore(candidateSources),
        });
      } else {
        // Merge into existing charger adhering to Data Priority Matrix
        const existing = merged[bestMatchIndex];
        const combinedSources = Array.from(
          new Set([...(existing.sources || []), ...(candidate.sources || [])])
        );

        const candidateSources = candidate.sources || [];
        const existingSources = existing.sources || [];

        // Data Priority: Operator/OCPI > MITECO > Google > OSM
        const isCandidateHigherPriority =
          candidateSources.includes('OPERATOR') ||
          candidateSources.includes('OCPI') ||
          (candidateSources.includes('MITECO') && !existingSources.includes('MITECO'));

        const primary = isCandidateHigherPriority ? candidate : existing;
        const secondary = isCandidateHigherPriority ? existing : candidate;

        merged[bestMatchIndex] = {
          ...primary,
          id: existing.id,
          externalIds: [
            ...(existing.externalIds || []),
            ...(candidate.externalIds || []),
          ],
          name: primary.name || secondary.name,
          powerKw: Math.max(existing.powerKw, candidate.powerKw),
          evses: primary.evses.length >= secondary.evses.length ? primary.evses : secondary.evses,
          pricing: primary.pricing || secondary.pricing,
          sources: combinedSources,
          sourceRecords: [
            ...(existing.sourceRecords || []),
            ...(candidate.sourceRecords || []),
          ],
          confidenceScore: this.calculateConfidenceScore(combinedSources),
          lastUpdated: new Date().toISOString(),
        };
      }
    }

    return merged;
  }
}
