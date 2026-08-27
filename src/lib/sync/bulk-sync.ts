import { PrismaClient } from '@prisma/client';
import { MinistryFuelProvider, NormalizedStation } from '../providers/ministry';

const prisma = new PrismaClient();

export async function bulkSyncAllSpain(): Promise<number> {
  const provider = new MinistryFuelProvider();
  console.log('🚀 Downloading all 12,000+ stations from Ministry MITECO API...');
  const { stations } = await provider.getAllStations();
  console.log(`📥 Downloaded ${stations.length} stations from MITECO. Starting fast bulk upsert...`);

  const chunkSize = 200;
  let totalProcessed = 0;

  for (let i = 0; i < stations.length; i += chunkSize) {
    const chunk = stations.slice(i, i + chunkSize);

    await Promise.all(
      chunk.map(async (st: NormalizedStation) => {
        try {
          const stationRecord = await prisma.station.upsert({
            where: { ministryId: st.ministryId },
            update: {
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
              lastPriceSync: new Date(),
              isActive: true,
            },
            create: {
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
              lastPriceSync: new Date(),
              isActive: true,
            },
          });

          // Bulk upsert prices
          for (const [fuelType, price] of Object.entries(st.prices)) {
            await prisma.fuelPrice.upsert({
              where: {
                stationId_fuelType: {
                  stationId: stationRecord.id,
                  fuelType,
                },
              },
              update: { price, priceDate: new Date() },
              create: {
                stationId: stationRecord.id,
                fuelType,
                price,
                priceDate: new Date(),
              },
            });
          }
          totalProcessed++;
        } catch (e) {
          // ignore minor individual error
        }
      })
    );

    if ((i + chunkSize) % 1000 < chunkSize) {
      console.log(`⏳ Processed ${Math.min(i + chunkSize, stations.length)} / ${stations.length} stations...`);
    }
  }

  console.log(`✅ Bulk sync complete: ${totalProcessed} stations synced across all Spain!`);
  return totalProcessed;
}
