import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { DiscountEngine } from '@/lib/engine/discount-calculator';
import { CalculatedStation, DiscountRule, FuelType } from '@/lib/types/fuel';
import { DEFAULT_LOYALTY_PROGRAMS } from '@/lib/data/seed-programs';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const {
      stationIds = [],
      fuel = 'GASOLINA_95_E5' as FuelType,
      lat = null,
      lng = null,
      tankCapacity = 50,
      discounts = DEFAULT_LOYALTY_PROGRAMS,
    } = await req.json();

    if (!Array.isArray(stationIds) || stationIds.length === 0) {
      return NextResponse.json({ error: 'Debes proporcionar al menos una estación' }, { status: 400 });
    }

    const stations = await prisma.station.findMany({
      where: {
        id: { in: stationIds },
      },
      include: {
        prices: true,
      },
    });

    const compared: CalculatedStation[] = [];

    for (const st of stations) {
      const pricesMap: Record<string, number> = {};
      st.prices.forEach((p) => {
        pricesMap[p.fuelType] = p.price;
      });

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

      const calc = DiscountEngine.calculateStationMetrics(
        stationData,
        fuel,
        lat,
        lng,
        discounts as DiscountRule[],
        tankCapacity
      );

      if (calc) {
        compared.push(calc);
      }
    }

    // Sort by final price
    compared.sort((a, b) => a.finalPrice - b.finalPrice);

    return NextResponse.json({
      fuel,
      tankCapacity,
      compared,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error comparando';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
