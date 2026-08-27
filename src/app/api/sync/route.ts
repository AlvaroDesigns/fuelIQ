import { NextResponse } from 'next/server';
import { SyncEngine } from '@/lib/sync/sync-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max allowed on Vercel Hobby free tier

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;

    const engine = new SyncEngine();
    const result = await engine.syncStations(limit);

    return NextResponse.json({
      success: true,
      message: 'Sincronización completada con éxito',
      result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Safe read-only or quick sync info
  return NextResponse.json({
    endpoint: '/api/sync',
    method: 'POST',
    description: 'Dispara una sincronización con la API oficial del Ministerio para la Transición Ecológica.',
  });
}
