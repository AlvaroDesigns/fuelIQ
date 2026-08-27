import { prisma } from '../db/prisma';
import { MinistryFuelProvider, NormalizedStation } from '../providers/ministry';
import { DEFAULT_LOYALTY_PROGRAMS } from '../data/seed-programs';

export class SyncEngine {
  private provider: MinistryFuelProvider;

  constructor() {
    this.provider = new MinistryFuelProvider();
  }

  /**
   * Seed default loyalty programs if not present
   */
  public async ensureDefaultPrograms(): Promise<void> {
    try {
      for (const prog of DEFAULT_LOYALTY_PROGRAMS) {
        await prisma.discountProgram.upsert({
          where: { code: prog.id },
          update: {
            name: prog.name,
            brand: prog.brand,
            description: prog.description,
            discountType: prog.discountType,
            defaultValue: prog.value,
          },
          create: {
            code: prog.id,
            name: prog.name,
            brand: prog.brand,
            description: prog.description,
            discountType: prog.discountType,
            defaultValue: prog.value,
            isOfficial: true,
            active: prog.active,
          },
        });
      }
    } catch (err) {
      console.warn('Could not seed loyalty programs:', err);
    }
  }

  /**
   * Run a synchronization process
   */
  public async syncStations(limit?: number): Promise<{
    syncId: string;
    stationsReceived: number;
    stationsUpdated: number;
    pricesChanged: number;
    durationMs: number;
  }> {
    const startTime = Date.now();
    await this.ensureDefaultPrograms();

    // Create sync run record
    const syncRun = await prisma.syncRun.create({
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
        source: 'MINISTRY_REST',
      },
    });

    try {
      console.log('🔄 Fetching stations from MITECO...');
      const { stations: allStations } = await this.provider.getAllStations();
      const stations = limit ? allStations.slice(0, limit) : allStations;

      console.log(`📥 Received ${stations.length} stations. Processing updates...`);

      let stationsUpdated = 0;
      let pricesChanged = 0;

      // Process in chunks of 50 for optimal database performance
      const chunkSize = 50;
      for (let i = 0; i < stations.length; i += chunkSize) {
        const chunk = stations.slice(i, i + chunkSize);

        await Promise.all(
          chunk.map(async (st: NormalizedStation) => {
            try {
              // 1. Upsert Station
              const stationRecord = await prisma.station.upsert({
                where: { ministryId: st.ministryId },
                update: {
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
                  municipalityId: st.municipalityId,
                  province: st.province,
                  provinceId: st.provinceId,
                  postalCode: st.postalCode,
                  latitude: st.latitude,
                  longitude: st.longitude,
                  schedule: st.schedule,
                  margin: st.margin,
                  saleType: st.saleType,
                  lastPriceSync: new Date(),
                  isActive: true,
                },
                include: {
                  prices: true,
                },
              });

              stationsUpdated++;

              // 2. Process prices and track price history changes
              const existingPricesMap = new Map(
                stationRecord.prices.map((p) => [p.fuelType, p])
              );

              for (const [fuelType, price] of Object.entries(st.prices)) {
                const existing = existingPricesMap.get(fuelType);

                if (!existing) {
                  // New price
                  await prisma.fuelPrice.create({
                    data: {
                      stationId: stationRecord.id,
                      fuelType,
                      price,
                      priceDate: new Date(),
                    },
                  });

                  await prisma.fuelPriceHistory.create({
                    data: {
                      stationId: stationRecord.id,
                      fuelType,
                      price,
                      validFrom: new Date(),
                    },
                  });
                  pricesChanged++;
                } else if (Math.abs(existing.price - price) > 0.0001) {
                  // Price has changed!
                  const now = new Date();

                  // Close previous price validity in history
                  await prisma.fuelPriceHistory.updateMany({
                    where: {
                      stationId: stationRecord.id,
                      fuelType,
                      validTo: null,
                    },
                    data: { validTo: now },
                  });

                  // Add new price history entry
                  await prisma.fuelPriceHistory.create({
                    data: {
                      stationId: stationRecord.id,
                      fuelType,
                      price,
                      validFrom: now,
                    },
                  });

                  // Update current price
                  await prisma.fuelPrice.update({
                    where: { id: existing.id },
                    data: {
                      price,
                      priceDate: now,
                    },
                  });

                  pricesChanged++;
                }
              }
            } catch (stationErr) {
              console.error(`Error processing station ${st.ministryId}:`, stationErr);
            }
          })
        );
      }

      const durationMs = Date.now() - startTime;

      // Update sync run
      await prisma.syncRun.update({
        where: { id: syncRun.id },
        data: {
          status: 'SUCCESS',
          finishedAt: new Date(),
          stationsReceived: stations.length,
          stationsUpdated,
          pricesChanged,
        },
      });

      console.log(`✅ Sync completed in ${durationMs}ms: ${stationsUpdated} stations, ${pricesChanged} price updates.`);

      return {
        syncId: syncRun.id,
        stationsReceived: stations.length,
        stationsUpdated,
        pricesChanged,
        durationMs,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('❌ Sync failed:', errorMsg);

      await prisma.syncRun.update({
        where: { id: syncRun.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          errors: errorMsg,
        },
      });

      throw err;
    }
  }
}
