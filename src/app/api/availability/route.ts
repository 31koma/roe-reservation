import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
        return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    try {
        const reservations = await prisma.reservation.findMany({
            where: {
                date: date,
                status: {
                    in: ['CONFIRMED', 'PENDING']
                },
            },
        });

        const slots = ['11:30', '12:15', '13:00'];
        const availability: Record<string, number> = {};

        slots.forEach(slot => {
            const slotReservations = reservations.filter(r => r.timeSlot === slot);
            const totalPeople = slotReservations.reduce((sum, r) => sum + r.people, 0);
            const remaining = Math.max(0, 6 - totalPeople);
            availability[slot] = remaining;
        });

        return NextResponse.json(availability);
    } catch (error) {
        console.error('Error fetching availability:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
