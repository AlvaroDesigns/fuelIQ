import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { DEFAULT_LOYALTY_PROGRAMS } from '@/lib/data/seed-programs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let programs = await prisma.discountProgram.findMany({
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });

    if (programs.length === 0) {
      // Seed if empty
      for (const prog of DEFAULT_LOYALTY_PROGRAMS) {
        await prisma.discountProgram.upsert({
          where: { code: prog.id },
          update: {},
          create: {
            code: prog.id,
            name: prog.name,
            brand: prog.brand,
            description: prog.description,
            discountType: prog.discountType,
            defaultValue: prog.value,
            active: prog.active,
          },
        });
      }
      programs = await prisma.discountProgram.findMany();
    }

    return NextResponse.json({ programs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error cargando programas';
    return NextResponse.json({ error: message, programs: DEFAULT_LOYALTY_PROGRAMS });
  }
}
