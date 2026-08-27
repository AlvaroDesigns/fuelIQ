import { CalculatedEVStation, EVConnectorType, EVFilterParams, EVStation } from '../types/ev';
import { DiscountRule } from '../types/fuel';
import { DiscountEngine } from './discount-calculator';

export class EVCalculatorEngine {
  /**
   * Calculate full metrics for an EV Charging Station
   */
  public static calculateEVMetrics(
    station: EVStation,
    userLat: number | null,
    userLng: number | null,
    activeDiscounts: DiscountRule[],
    batteryCapacityKwh: number = 60,
    targetChargePercentage: number = 70 // default 10% -> 80% = 70% of battery
  ): CalculatedEVStation {
    let distanceKm = 0;
    if (userLat !== null && userLng !== null) {
      distanceKm = DiscountEngine.calculateDistanceKm(userLat, userLng, station.latitude, station.longitude);
    }

    const officialPricePerKwh = station.pricePerKwh;

    // Check if user has active discount/membership for this operator
    let appliedDiscountName: string | undefined = undefined;
    let savingPerKwh = 0;

    const matchingRule = activeDiscounts.find(
      (d) =>
        d.active &&
        (d.brand.toUpperCase() === station.operator.toUpperCase() ||
          station.operatorName.toUpperCase().includes(d.brand.toUpperCase()) ||
          d.brand === 'ALL')
    );

    if (matchingRule) {
      appliedDiscountName = matchingRule.name;
      if (matchingRule.discountType === 'FIXED_PER_LITER' || matchingRule.discountType === 'CASHBACK_PER_LITER') {
        savingPerKwh = matchingRule.value;
      } else if (matchingRule.discountType === 'PERCENTAGE') {
        savingPerKwh = officialPricePerKwh * (matchingRule.value / 100);
      }
    } else if (station.memberPricePerKwh && station.memberPricePerKwh < officialPricePerKwh) {
      // Default member price reference if no custom rule
      // keep officialPricePerKwh as base
    }

    const effectivePricePerKwh = Math.max(0.1, Math.round((officialPricePerKwh - savingPerKwh) * 100) / 100);
    savingPerKwh = Math.round((officialPricePerKwh - effectivePricePerKwh) * 100) / 100;

    // Energy needed for target session (e.g. 70% of a 60 kWh battery = 42 kWh)
    const sessionKwh = Math.round(((batteryCapacityKwh * targetChargePercentage) / 100) * 10) / 10;

    const sessionCostOfficial = Math.round(sessionKwh * officialPricePerKwh * 100) / 100;
    const sessionCostEffective = Math.round(sessionKwh * effectivePricePerKwh * 100) / 100;
    const sessionSaving = Math.round((sessionCostOfficial - sessionCostEffective) * 100) / 100;

    // Time estimate: based on station max power and real charging curve average (~75% of peak power)
    const effectiveChargingPowerKw = Math.max(7, Math.min(station.maxPowerKw * 0.75, 200));
    const estimatedHours = sessionKwh / effectiveChargingPowerKw;
    const estimatedMinutesToCharge = Math.max(12, Math.round(estimatedHours * 60));

    // Travel cost estimated (assuming ~17 kWh/100km consumption for average EV)
    const tripKwh = ((distanceKm * 2) * 17.0) / 100;
    const travelCostEstimated = Math.round(tripKwh * effectivePricePerKwh * 100) / 100;

    // Smart score = Total cost of session + travel cost
    const smartScore = Math.round((sessionCostEffective + travelCostEstimated) * 100) / 100;

    return {
      station,
      distanceKm,
      officialPricePerKwh,
      effectivePricePerKwh,
      savingPerKwh,
      appliedDiscountName,
      sessionKwh,
      sessionCostOfficial,
      sessionCostEffective,
      sessionSaving,
      estimatedMinutesToCharge,
      travelCostEstimated,
      smartScore,
    };
  }

  /**
   * Filter and sort EV stations
   */
  public static filterEVStations(
    stations: CalculatedEVStation[],
    filters: EVFilterParams,
    maxRadiusKm: number,
    sortBy: 'finalPrice' | 'distance' | 'tankSaving' | 'officialPrice' | 'smartScore' = 'finalPrice'
  ): CalculatedEVStation[] {
    return stations
      .filter((item) => {
        // Radius check
        if (item.distanceKm > maxRadiusKm && maxRadiusKm > 0) return false;

        // Power Category check
        if (filters.powerCategory === 'ULTRARAPID' && item.station.maxPowerKw < 150) return false;
        if (filters.powerCategory === 'RAPID' && (item.station.maxPowerKw < 50 || item.station.maxPowerKw >= 150)) return false;
        if (filters.powerCategory === 'SEMIRAPID' && (item.station.maxPowerKw < 11 || item.station.maxPowerKw >= 50)) return false;

        // Connector type check
        if (filters.selectedConnectors.length > 0) {
          const hasMatchingConnector = item.station.connectors.some((c) =>
            filters.selectedConnectors.includes(c.type)
          );
          if (!hasMatchingConnector) return false;
        }

        // Operator check
        if (filters.selectedOperator && filters.selectedOperator !== 'ALL') {
          if (item.station.operator !== filters.selectedOperator) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
        if (sortBy === 'smartScore') return (a.smartScore || 0) - (b.smartScore || 0);
        if (sortBy === 'tankSaving') return b.sessionSaving - a.sessionSaving;
        if (sortBy === 'officialPrice') return a.officialPricePerKwh - b.officialPricePerKwh;
        // Default: effective price / session cost
        return a.sessionCostEffective - b.sessionCostEffective;
      });
  }
}
