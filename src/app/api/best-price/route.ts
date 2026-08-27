import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { DiscountEngine } from '@/lib/engine/discount-calculator';
import { CalculatedStation, DiscountRule, FuelType } from '@/lib/types/fuel';
import { DEFAULT_LOYALTY_PROGRAMS } from '@/lib/data/seed-programs';
import { SyncEngine } from '@/lib/sync/sync-engine';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      lat = 40.4168, // Default to Madrid if unspecified
      lng = -3.7038,
      radius = 5, // km default
      fuel = 'GASOLINA_95_E5' as FuelType,
      brand,
      tankCapacity = 50,
      consumption = 6.5,
      discounts = [],
      sortBy = 'finalPrice', // 'finalPrice' | 'tankSaving' | 'distance' | 'smartScore'
      limit = 500,
    } = body;

    // Check if database has stations; if not, trigger quick initial sync
    const stationCount = await prisma.station.count();
    if (stationCount === 0) {
      const engine = new SyncEngine();
      await engine.syncStations(250);
    }

    // Prepare active discount rules list (merge defaults with client customizations)
    let userDiscounts: DiscountRule[] = [];
    if (Array.isArray(discounts) && discounts.length > 0) {
      userDiscounts = discounts;
    } else {
      userDiscounts = DEFAULT_LOYALTY_PROGRAMS;
    }

    // Build Prisma query with geographical bounding box filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };
    if (brand && brand !== 'ALL') {
      where.brand = brand.toUpperCase();
    }

    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      const latDelta = (radius + 15) / 111;
      const lngDelta = (radius + 15) / (111 * Math.abs(Math.cos((lat * Math.PI) / 180)));
      where.latitude = { gte: lat - latDelta, lte: lat + latDelta };
      where.longitude = { gte: lng - lngDelta, lte: lng + lngDelta };
    }

    const rawStations = await prisma.station.findMany({
      where,
      include: {
        prices: true,
      },
      take: 1500,
    });

    const calculatedStations: CalculatedStation[] = [];

    for (const st of rawStations) {
      const pricesMap: Record<string, number> = {};
      st.prices.forEach((p) => {
        pricesMap[p.fuelType] = p.price;
      });

      // Filter by radius first
      const dist = DiscountEngine.calculateDistanceKm(lat, lng, st.latitude, st.longitude);
      if (dist > radius) continue;

      const stationData = {
        id: st.id,
        ministryId: st.ministryId,
        brand: st.brand,
        rawBrand: st.rawBrand,
        name: st.name,
        address: st.address,
        locality: st.locality,
        municipality: st.municipality,
        municipalityId: st.municipalityId,
        province: st.province,
        provinceId: st.provinceId,
        postalCode: st.postalCode,
        latitude: st.latitude,
        longitude: st.longitude,
        schedule: st.schedule,
        margin: st.margin,
        saleType: st.saleType,
        isActive: st.isActive,
        lastPriceSync: st.lastPriceSync,
        prices: pricesMap,
      };

      const calculated = DiscountEngine.calculateStationMetrics(
        stationData,
        fuel,
        lat,
        lng,
        userDiscounts,
        tankCapacity,
        consumption
      );

      if (calculated) {
        calculatedStations.push(calculated);
      }
    }

    // Sort according to user preference
    calculatedStations.sort((a, b) => {
      if (sortBy === 'distance') {
        return a.distanceKm - b.distanceKm;
      }
      if (sortBy === 'tankSaving') {
        return b.tankSaving - a.tankSaving;
      }
      if (sortBy === 'smartScore') {
        return (a.smartScore ?? a.finalPrice) - (b.smartScore ?? b.finalPrice);
      }
      if (sortBy === 'officialPrice') {
        return a.officialPrice - b.officialPrice;
      }
      // Default: 'finalPrice'
      if (Math.abs(a.finalPrice - b.finalPrice) < 0.001) {
        return a.distanceKm - b.distanceKm;
      }
      return a.finalPrice - b.finalPrice;
    });

    const results = calculatedStations.slice(0, limit);
    const bestOption = results.length > 0 ? results[0] : null;

    // Calculate aggregated metrics
    const avgOfficialPrice =
      results.length > 0
        ? Math.round(
            (results.reduce((acc, curr) => acc + curr.officialPrice, 0) / results.length) * 1000
          ) / 1000
        : 0;

    const avgFinalPrice =
      results.length > 0
        ? Math.round(
            (results.reduce((acc, curr) => acc + curr.finalPrice, 0) / results.length) * 1000
          ) / 1000
        : 0;

    const maxSaving =
      results.length > 0 ? Math.max(...results.map((r) => r.tankSaving)) : 0;

    return NextResponse.json({
      bestOption,
      results,
      totalCount: calculatedStations.length,
      metrics: {
        avgOfficialPrice,
        avgFinalPrice,
        maxSaving,
        tankCapacity,
        fuel,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error calculando mejores precios';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : 40.4168;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : -3.7038;
    const radius = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : 20;
    const fuel = (searchParams.get('fuel') as FuelType) || 'GASOLINA_95_E5';
    const tankCapacity = searchParams.get('tankCapacity')
      ? parseFloat(searchParams.get('tankCapacity')!)
      : 50;
    const sortBy = (searchParams.get('sortBy') as 'finalPrice' | 'distance' | 'tankSaving' | 'officialPrice' | 'smartScore') || 'finalPrice';

    const mockRequest = new Request('http://localhost/api/best-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat,
        lng,
        radius,
        fuel,
        tankCapacity,
        sortBy,
        discounts: DEFAULT_LOYALTY_PROGRAMS,
      }),
    });

    return POST(mockRequest);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
