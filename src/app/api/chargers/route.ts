import { NextResponse } from 'next/server';
import { ChargerAggregator } from '@/lib/providers/chargers/ChargerAggregator';
import { ChargerQueryFilter, NormalizedConnectorType, ChargerStatus } from '@/lib/types/charger';

export const dynamic = 'force-dynamic';

const aggregator = new ChargerAggregator();

/**
 * GET /api/chargers?lat=39.5696&lng=2.6502&radius=20&minPower=100&connector=CCS&operator=ENDESA
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const lat = parseFloat(searchParams.get('lat') || '39.5696');
    const lng = parseFloat(searchParams.get('lng') || '2.6502');
    const radiusKm = parseFloat(searchParams.get('radius') || '25');
    const minPowerKw = searchParams.get('minPower') ? parseFloat(searchParams.get('minPower')!) : undefined;
    const maxPowerKw = searchParams.get('maxPower') ? parseFloat(searchParams.get('maxPower')!) : undefined;
    const connector = (searchParams.get('connector')?.toUpperCase() as NormalizedConnectorType) || 'ALL';
    const operator = searchParams.get('operator') || 'ALL';
    const status = (searchParams.get('status')?.toUpperCase() as ChargerStatus) || 'ALL';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;

    const filter: ChargerQueryFilter = {
      lat,
      lng,
      radiusKm,
      minPowerKw,
      connector,
      operator,
      status,
    };

    let response = await aggregator.getChargers(filter);

    if (maxPowerKw) {
      response.chargers = response.chargers.filter((c) => c.powerKw <= maxPowerKw);
      response.count = response.chargers.length;
    }

    if (limit && limit > 0) {
      response.chargers = response.chargers.slice(0, limit);
      response.count = response.chargers.length;
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error consultando puntos de recarga';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/chargers
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      lat = 39.5696,
      lng = 2.6502,
      radius = 25,
      minPower,
      maxPower,
      connector = 'ALL',
      operator = 'ALL',
      status = 'ALL',
      limit,
    } = body;

    const filter: ChargerQueryFilter = {
      lat,
      lng,
      radiusKm: radius,
      minPowerKw: minPower,
      connector,
      operator,
      status,
    };

    let response = await aggregator.getChargers(filter);

    if (maxPower) {
      response.chargers = response.chargers.filter((c) => c.powerKw <= maxPower);
      response.count = response.chargers.length;
    }

    if (limit && limit > 0) {
      response.chargers = response.chargers.slice(0, limit);
      response.count = response.chargers.length;
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error consultando puntos de recarga';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
