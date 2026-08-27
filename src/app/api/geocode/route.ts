import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export interface GeocodeResult {
  displayName: string;
  name: string;
  postalCode?: string;
  municipality?: string;
  province?: string;
  lat: number;
  lng: number;
  source: 'database' | 'osm' | 'zippo';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    // 0. Reverse Geocoding if coordinates are provided
    if (latParam && lngParam) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);
      if (!isNaN(lat) && !isNaN(lng)) {
        // Query Nominatim Reverse
        try {
          const revUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
          const osmRes = await fetch(revUrl, {
            headers: {
              'User-Agent': 'FuelIQ-App/1.0 (info@fueliq.es)',
              'Accept-Language': 'es-ES,es;q=0.9',
            },
            next: { revalidate: 86400 },
          });

          if (osmRes.ok) {
            const item = await osmRes.json();
            const addr = item.address || {};
            const city =
              addr.village ||
              addr.town ||
              addr.city ||
              addr.municipality ||
              addr.hamlet ||
              addr.county ||
              '';
            const prov = addr.state_district || addr.province || addr.state || '';
            const postalCode = addr.postcode || '';

            if (city) {
              return NextResponse.json({
                success: true,
                name: city,
                municipality: city,
                province: prov,
                postalCode,
                displayName: `${city}${prov && prov !== city ? `, ${prov}` : ''}`,
                lat,
                lng,
                source: 'osm',
              });
            }
          }
        } catch (err) {
          console.warn('OSM reverse geocoding error:', err);
        }

        // Database nearest station fallback
        try {
          const nearest = await prisma.station.findFirst({
            where: {
              latitude: { gte: lat - 0.2, lte: lat + 0.2 },
              longitude: { gte: lng - 0.2, lte: lng + 0.2 },
            },
            select: {
              municipality: true,
              province: true,
              postalCode: true,
            },
          });

          if (nearest && nearest.municipality) {
            return NextResponse.json({
              success: true,
              name: nearest.municipality,
              municipality: nearest.municipality,
              province: nearest.province,
              postalCode: nearest.postalCode,
              displayName: `${nearest.municipality}${nearest.province ? `, ${nearest.province}` : ''}`,
              lat,
              lng,
              source: 'database',
            });
          }
        } catch {}

        return NextResponse.json({
          success: true,
          name: 'Mi Ubicación',
          municipality: 'Mi Ubicación',
          province: '',
          displayName: 'Mi Ubicación',
          lat,
          lng,
          source: 'default',
        });
      }
    }

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const results: GeocodeResult[] = [];
    const isPostalCode = /^\d{5}$/.test(query);

    // 1. If 5-digit Spanish Postal Code -> Use structured postalcode geocoder first
    if (isPostalCode) {
      try {
        const postalUrl = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(
          query
        )}&countrycodes=es&format=json&addressdetails=1&limit=5`;

        const postalRes = await fetch(postalUrl, {
          headers: {
            'User-Agent': 'FuelIQ-App/1.0 (info@fueliq.es)',
            'Accept-Language': 'es-ES,es;q=0.9',
          },
          next: { revalidate: 86400 },
        });

        if (postalRes.ok) {
          const postalData = await postalRes.json();
          for (const item of postalData) {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            const addr = item.address || {};
            const city =
              addr.village ||
              addr.town ||
              addr.city ||
              addr.municipality ||
              addr.hamlet ||
              item.name;
            const prov = addr.state_district || addr.province || addr.county || '';
            const region = addr.state || 'España';

            if (!isNaN(lat) && !isNaN(lng)) {
              results.push({
                displayName: `${query} - ${city}${prov ? `, ${prov}` : ''} (${region})`,
                name: `${city} (${query})`,
                postalCode: query,
                municipality: city,
                province: prov || region,
                lat,
                lng,
                source: 'osm',
              });
            }
          }
        }
      } catch (err) {
        console.warn('Postal code Nominatim lookup error:', err);
      }

      // Secondary fallback for Postal Codes: Zippopotam Spain API
      if (results.length === 0) {
        try {
          const zippoRes = await fetch(`https://api.zippopotam.us/es/${query}`);
          if (zippoRes.ok) {
            const zippoData = await zippoRes.json();
            const places = zippoData.places || [];
            for (const p of places) {
              const lat = parseFloat(p.latitude);
              const lng = parseFloat(p.longitude);
              const city = p['place name'];
              const state = p.state;

              if (!isNaN(lat) && !isNaN(lng)) {
                results.push({
                  displayName: `${query} - ${city} (${state})`,
                  name: `${city} (${query})`,
                  postalCode: query,
                  municipality: city,
                  province: state,
                  lat,
                  lng,
                  source: 'zippo',
                });
              }
            }
          }
        } catch {}
      }

      // Tertiary: Check database stations by postal code
      if (results.length === 0) {
        try {
          const dbStations = await prisma.station.findMany({
            where: { postalCode: query },
            select: {
              latitude: true,
              longitude: true,
              municipality: true,
              province: true,
              postalCode: true,
            },
            take: 10,
          });

          if (dbStations.length > 0) {
            const avgLat =
              dbStations.reduce((sum, s) => sum + s.latitude, 0) / dbStations.length;
            const avgLng =
              dbStations.reduce((sum, s) => sum + s.longitude, 0) / dbStations.length;
            const first = dbStations[0];

            results.push({
              displayName: `${first.postalCode} - ${first.municipality} (${first.province})`,
              name: `${first.municipality} (${first.postalCode})`,
              postalCode: first.postalCode,
              municipality: first.municipality,
              province: first.province,
              lat: Math.round(avgLat * 100000) / 100000,
              lng: Math.round(avgLng * 100000) / 100000,
              source: 'database',
            });
          }
        } catch {}
      }
    } else {
      // 2. Text Search (City / Town / Municipality name)
      // Check database first
      try {
        const dbMunicipality = await prisma.station.findFirst({
          where: {
            OR: [
              { municipality: { contains: query, mode: 'insensitive' } },
              { province: { contains: query, mode: 'insensitive' } },
              { locality: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: {
            latitude: true,
            longitude: true,
            municipality: true,
            province: true,
            postalCode: true,
          },
        });

        if (dbMunicipality) {
          results.push({
            displayName: `${dbMunicipality.municipality} (${dbMunicipality.province})`,
            name: dbMunicipality.municipality,
            postalCode: dbMunicipality.postalCode,
            municipality: dbMunicipality.municipality,
            province: dbMunicipality.province,
            lat: dbMunicipality.latitude,
            lng: dbMunicipality.longitude,
            source: 'database',
          });
        }
      } catch {}

      // Query Nominatim with Spain focus
      try {
        const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=es&addressdetails=1&limit=5&q=${encodeURIComponent(
          query + ', España'
        )}`;

        const osmRes = await fetch(osmUrl, {
          headers: {
            'User-Agent': 'FuelIQ-App/1.0 (info@fueliq.es)',
            'Accept-Language': 'es-ES,es;q=0.9',
          },
          next: { revalidate: 86400 },
        });

        if (osmRes.ok) {
          const osmData = await osmRes.json();
          for (const item of osmData) {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            const addr = item.address || {};
            const cp = addr.postcode;
            const city =
              addr.village ||
              addr.town ||
              addr.city ||
              addr.municipality ||
              addr.hamlet ||
              item.name;
            const prov = addr.state_district || addr.province || addr.county || addr.state;

            const alreadyExists = results.some(
              (r) => Math.abs(r.lat - lat) < 0.01 && Math.abs(r.lng - lng) < 0.01
            );

            if (!alreadyExists && !isNaN(lat) && !isNaN(lng)) {
              results.push({
                displayName: item.display_name.split(',').slice(0, 3).join(',').trim(),
                name: city || item.name,
                postalCode: cp,
                municipality: city,
                province: prov,
                lat,
                lng,
                source: 'osm',
              });
            }
          }
        }
      } catch (osmErr) {
        console.warn('OSM Geocoding fallback error:', osmErr);
      }
    }

    return NextResponse.json({ results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error geocoding';
    return NextResponse.json({ error: message, results: [] }, { status: 500 });
  }
}
