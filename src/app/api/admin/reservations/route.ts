import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    try {
        const whereClause = date ? { date } : {};

        const reservations = await prisma.reservation.findMany({
            where: whereClause,
            orderBy: [
                { date: 'asc' },
                { timeSlot: 'asc' },
            ],
        });

        return NextResponse.json(reservations);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
