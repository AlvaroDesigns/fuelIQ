import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [stationCount, priceCount, lastSync] = await Promise.all([
      prisma.station.count(),
      prisma.fuelPrice.count(),
      prisma.syncRun.findFirst({
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    // Calculate sample average prices by fuel type
    const avgPrices = await prisma.fuelPrice.groupBy({
      by: ['fuelType'],
      _avg: {
        price: true,
      },
      _min: {
        price: true,
      },
      _max: {
        price: true,
      },
    });

    return NextResponse.json({
      stationsTotal: stationCount,
      totalStations: stationCount,
      pricesTotal: priceCount,
      lastSync: lastSync
        ? {
            id: lastSync.id,
            status: lastSync.status,
            startedAt: lastSync.startedAt,
            finishedAt: lastSync.finishedAt,
            stationsUpdated: lastSync.stationsUpdated,
            pricesChanged: lastSync.pricesChanged,
          }
        : null,
      averages: avgPrices.map((p) => ({
        fuelType: p.fuelType,
        avg: p._avg.price ? Math.round(p._avg.price * 1000) / 1000 : 0,
        min: p._min.price,
        max: p._max.price,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error cargando estadísticas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
