import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { DiscountEngine } from '@/lib/engine/discount-calculator';
import { FuelType } from '@/lib/types/fuel';
import { SyncEngine } from '@/lib/sync/sync-engine';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
    const radius = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : 5; // km
    const fuel = (searchParams.get('fuel') as FuelType) || 'GASOLINA_95_E5';
    const brand = searchParams.get('brand') || undefined;
    const province = searchParams.get('province') || undefined;
    const municipality = searchParams.get('municipality') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100;

    // Check if database has stations; if not, trigger a fast initial sync of top 250 stations
    const stationCount = await prisma.station.count();
    if (stationCount === 0) {
      console.log('Database empty, triggering fast initial sync...');
      const engine = new SyncEngine();
      await engine.syncStations(250);
    }

    // Build filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };

    if (brand && brand !== 'ALL') {
      where.brand = brand.toUpperCase();
    }

    if (province) {
      where.province = { contains: province, mode: 'insensitive' };
    }

    if (municipality) {
      where.municipality = { contains: municipality, mode: 'insensitive' };
    }

    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      const latDelta = (radius + 15) / 111;
      const lngDelta = (radius + 15) / (111 * Math.abs(Math.cos((lat * Math.PI) / 180)));
      where.latitude = { gte: lat - latDelta, lte: lat + latDelta };
      where.longitude = { gte: lng - lngDelta, lte: lng + lngDelta };
    }

    // Query stations with their fuel prices
    const stations = await prisma.station.findMany({
      where,
      include: {
        prices: true,
      },
      take: 250,
    });

    // Map to API format and apply fuel filter & distance calculation
    const formatted = stations
      .map((st) => {
        const pricesMap: Record<string, number> = {};
        st.prices.forEach((p) => {
          pricesMap[p.fuelType] = p.price;
        });

        const distanceKm =
          lat !== null && lng !== null
            ? DiscountEngine.calculateDistanceKm(lat, lng, st.latitude, st.longitude)
            : 0;

        return {
          id: st.id,
          ministryId: st.ministryId,
          brand: st.brand,
          rawBrand: st.rawBrand,
          name: st.name,
          address: st.address,
          locality: st.locality,
          municipality: st.municipality,
          province: st.province,
          postalCode: st.postalCode,
          latitude: st.latitude,
          longitude: st.longitude,
          schedule: st.schedule,
          margin: st.margin,
          saleType: st.saleType,
          isActive: st.isActive,
          lastPriceSync: st.lastPriceSync,
          prices: pricesMap,
          distanceKm,
        };
      })
      // Filter by fuel availability
      .filter((st) => !fuel || st.prices[fuel] !== undefined)
      // Filter by radius if lat/lng are provided
      .filter((st) => (lat !== null && lng !== null ? st.distanceKm <= radius : true))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    return NextResponse.json({
      total: formatted.length,
      stations: formatted,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
