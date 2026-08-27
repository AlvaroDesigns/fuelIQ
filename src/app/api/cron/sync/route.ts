import { NextResponse } from 'next/server';
import { SyncEngine } from '@/lib/sync/sync-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max allowed on Vercel Hobby free tier

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Verify Vercel Cron secret in production if configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized: Invalid Cron Secret' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;

    const engine = new SyncEngine();
    const result = await engine.syncStations(limit);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      source: 'VERCEL_CRON',
      result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Vercel Cron Sync Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
