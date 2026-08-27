import { CalculatedStation, DiscountRule, FuelType, StationData } from '../types/fuel';

export class DiscountEngine {
  /**
   * Calculate Haversine distance in kilometers between two coordinates
   */
  public static calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  /**
   * Calculate personal discount per liter applicable to a given station
   */
  public static calculateDiscountForStation(
    stationBrand: string,
    officialPrice: number,
    activeDiscounts: DiscountRule[],
    fuelType?: FuelType
  ): {
    discountPerLiter: number;
    appliedRuleName?: string;
  } {
    let totalDiscount = 0;
    const appliedNames: string[] = [];

    // Filter rules matching brand and fuel
    const matchingRules = activeDiscounts.filter((rule) => {
      if (!rule.active) return false;
      const matchesBrand =
        rule.brand === 'ALL' ||
        rule.brand.toUpperCase() === stationBrand.toUpperCase() ||
        stationBrand.toUpperCase().includes(rule.brand.toUpperCase());
      if (!matchesBrand) return false;

      // Fuel type restriction check
      if (fuelType && rule.applicableFuels && rule.applicableFuels.length > 0) {
        if (!rule.applicableFuels.includes(fuelType)) return false;
      }
      return true;
    });

    const stackableRules = matchingRules.filter((r) => r.stackable);
    const nonStackableRules = matchingRules.filter((r) => !r.stackable);

    for (const rule of stackableRules) {
      let val = 0;
      if (rule.discountType === 'FIXED_PER_LITER' || rule.discountType === 'CASHBACK_PER_LITER') {
        val = rule.value;
      } else if (rule.discountType === 'PERCENTAGE') {
        val = officialPrice * (rule.value / 100);
      }
      totalDiscount += val;
      appliedNames.push(rule.name);
    }

    if (nonStackableRules.length > 0) {
      let bestNonStack = 0;
      let bestNonStackName = '';
      for (const rule of nonStackableRules) {
        let val = 0;
        if (rule.discountType === 'FIXED_PER_LITER' || rule.discountType === 'CASHBACK_PER_LITER') {
          val = rule.value;
        } else if (rule.discountType === 'PERCENTAGE') {
          val = officialPrice * (rule.value / 100);
        }
        if (val > bestNonStack) {
          bestNonStack = val;
          bestNonStackName = rule.name;
        }
      }

      if (stackableRules.length === 0) {
        totalDiscount = bestNonStack;
        if (bestNonStackName) appliedNames.push(bestNonStackName);
      }
    }

    return {
      discountPerLiter: Math.round(totalDiscount * 1000) / 1000,
      appliedRuleName: appliedNames.length > 0 ? appliedNames.join(' + ') : undefined,
    };
  }

  /**
   * Approximate whether a station is open based on schedule string
   */
  public static isStationOpen(schedule?: string | null): boolean {
    if (!schedule) return true;
    const s = schedule.toUpperCase();
    if (s.includes('24H') || s.includes('24 H') || s.includes('24 HORAS')) return true;

    // Simple heuristic for typical Spanish format (e.g. "L-D: 07:00-22:00")
    try {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      const match = schedule.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
      if (match) {
        const openHour = parseInt(match[1], 10) + parseInt(match[2], 10) / 60;
        const closeHour = parseInt(match[3], 10) + parseInt(match[4], 10) / 60;
        if (closeHour > openHour) {
          return currentHour >= openHour && currentHour <= closeHour;
        } else {
          // Crosses midnight
          return currentHour >= openHour || currentHour <= closeHour;
        }
      }
    } catch {
      return true;
    }
    return true;
  }

  /**
   * Calculate full station metrics including effective price, tank costs, travel costs and savings
   */
  public static calculateStationMetrics(
    station: StationData,
    fuelType: FuelType,
    userLat: number | null,
    userLng: number | null,
    activeDiscounts: DiscountRule[],
    tankCapacityLiters: number = 50,
    vehicleConsumptionLitersPer100Km: number = 6.5
  ): CalculatedStation | null {
    let officialPrice = station.prices[fuelType];
    if ((!officialPrice || isNaN(officialPrice)) && fuelType === 'GASOLINA_95_E5') {
      officialPrice = station.prices['GASOLINA_95_E10'];
    }
    if ((!officialPrice || isNaN(officialPrice)) && fuelType === 'GASOLEO_A') {
      officialPrice = station.prices['GASOLEO_PREMIUM'];
    }

    if (!officialPrice || isNaN(officialPrice)) {
      return null;
    }

    const { discountPerLiter, appliedRuleName } = this.calculateDiscountForStation(
      station.brand,
      officialPrice,
      activeDiscounts,
      fuelType
    );

    const finalPrice = Math.max(0, Math.round((officialPrice - discountPerLiter) * 1000) / 1000);
    const savingPerLiter = Math.round(discountPerLiter * 1000) / 1000;

    let distanceKm = 0;
    if (userLat !== null && userLng !== null) {
      distanceKm = this.calculateDistanceKm(userLat, userLng, station.latitude, station.longitude);
    }

    // Tank filling costs
    const tankCostOfficial = Math.round(officialPrice * tankCapacityLiters * 100) / 100;
    const tankCostFinal = Math.round(finalPrice * tankCapacityLiters * 100) / 100;
    const tankSaving = Math.round((tankCostOfficial - tankCostFinal) * 100) / 100;

    // Travel cost estimation (round-trip 2x distance)
    const tripLiters = ((distanceKm * 2) * vehicleConsumptionLitersPer100Km) / 100;
    const travelCostEstimated = Math.round(tripLiters * finalPrice * 100) / 100;

    // Smart score = Total cost of tank + travel cost
    const smartScore = Math.round((tankCostFinal + travelCostEstimated) * 100) / 100;

    const isOpenNow = this.isStationOpen(station.schedule);

    return {
      station,
      fuelType,
      officialPrice,
      discountPerLiter,
      finalPrice,
      savingPerLiter,
      appliedDiscountName: appliedRuleName,
      distanceKm,
      tankCostOfficial,
      tankCostFinal,
      tankSaving,
      travelCostEstimated,
      smartScore,
      isOpenNow,
    };
  }
}
