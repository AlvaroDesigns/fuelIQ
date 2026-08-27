import { NextResponse } from 'next/server';
import { EVStationProvider } from '@/lib/providers/ev-provider';
import { EVCalculatorEngine } from '@/lib/engine/ev-calculator';
import { CalculatedEVStation, EVConnectorType, EVPowerCategory } from '@/lib/types/ev';
import { DEFAULT_LOYALTY_PROGRAMS } from '@/lib/data/seed-programs';
import { DiscountRule } from '@/lib/types/fuel';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      lat = 40.4168,
      lng = -3.7038,
      radius = 25,
      powerCategory = 'ALL' as EVPowerCategory,
      connectors = [] as EVConnectorType[],
      batteryCapacityKwh = 60,
      targetChargePercentage = 70,
      discounts = [],
      sortBy = 'finalPrice',
      operator = 'ALL',
      limit = 100,
    } = body;

    // Resolve user discounts or defaults
    let userDiscounts: DiscountRule[] = [];
    if (Array.isArray(discounts) && discounts.length > 0) {
      userDiscounts = discounts;
    } else {
      userDiscounts = DEFAULT_LOYALTY_PROGRAMS;
    }

    // Fetch live stations from EV provider via HTTP GET
    const stations = await EVStationProvider.fetchLiveEVStations(lat, lng, radius);

    // Calculate metrics for each station
    const calculatedList: CalculatedEVStation[] = stations.map((st: any) =>
      EVCalculatorEngine.calculateEVMetrics(
        st,
        lat,
        lng,
        userDiscounts,
        batteryCapacityKwh,
        targetChargePercentage
      )
    );

    // Filter and sort
    const filtered = EVCalculatorEngine.filterEVStations(
      calculatedList,
      {
        powerCategory,
        selectedConnectors: connectors,
        batteryCapacityKwh,
        targetChargePercentage,
        selectedOperator: operator,
      },
      radius,
      sortBy
    );

    const results = filtered.slice(0, limit);
    const bestOption = results.length > 0 ? results[0] : null;

    // Metrics summary
    const avgPricePerKwh =
      results.length > 0
        ? Math.round(
            (results.reduce((acc, curr) => acc + curr.effectivePricePerKwh, 0) / results.length) * 100
          ) / 100
        : 0.45;

    const maxPowerKw =
      results.length > 0 ? Math.max(...results.map((r) => r.station.maxPowerKw)) : 350;

    const maxSaving =
      results.length > 0 ? Math.max(...results.map((r) => r.sessionSaving)) : 0;

    return NextResponse.json({
      success: true,
      bestOption,
      results,
      totalCount: filtered.length,
      metrics: {
        avgPricePerKwh,
        maxPowerKw,
        batteryCapacityKwh,
        maxSaving,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener puntos de recarga EV';
    console.error('API /api/ev-stations error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : 40.4168;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : -3.7038;
    const radius = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : 25;
    const powerCategory = (searchParams.get('powerCategory') as EVPowerCategory) || 'ALL';
    const batteryCapacityKwh = searchParams.get('battery') ? parseFloat(searchParams.get('battery')!) : 60;
    const sortBy = (searchParams.get('sortBy') as any) || 'finalPrice';

    const mockRequest = new Request('http://localhost/api/ev-stations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat,
        lng,
        radius,
        powerCategory,
        batteryCapacityKwh,
        sortBy,
        discounts: DEFAULT_LOYALTY_PROGRAMS,
      }),
    });

    return POST(mockRequest);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
