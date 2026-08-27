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
  source: 'database' | 'osm';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const results: GeocodeResult[] = [];
    const isPostalCode = /^\d{5}$/.test(query);

    // 1. Try finding in local Neon database first
    if (isPostalCode) {
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
          displayName: `CP ${first.postalCode} - ${first.municipality} (${first.province})`,
          name: `${first.municipality} (${first.postalCode})`,
          postalCode: first.postalCode,
          municipality: first.municipality,
          province: first.province,
          lat: Math.round(avgLat * 100000) / 100000,
          lng: Math.round(avgLng * 100000) / 100000,
          source: 'database',
        });
      }
    } else {
      // Check municipality / locality in DB
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
    }

    // 2. Query OpenStreetMap Nominatim for exact address, CP or location in Spain
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=es&addressdetails=1&limit=5&q=${encodeURIComponent(
        query
      )}`;

      const osmRes = await fetch(osmUrl, {
        headers: {
          'User-Agent': 'FuelIQ-App/1.0 (info@fueliq.es)',
        },
        next: { revalidate: 86400 },
      });

      if (osmRes.ok) {
        const osmData = await osmRes.json();
        for (const item of osmData) {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          const addr = item.address || {};
          const cp = addr.postcode || (isPostalCode ? query : undefined);
          const city = addr.city || addr.town || addr.village || addr.municipality || item.name;
          const prov = addr.state || addr.province || addr.county;

          // Avoid duplicates
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

    return NextResponse.json({ results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error geocoding';
    return NextResponse.json({ error: message, results: [] }, { status: 500 });
  }
}
