import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendNotificationEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { date, timeSlot, name, phone, people, memo, teishokuCount, seatOnlyCount } = body;

        // Validation
        if (!date || !timeSlot || !name || !phone || !people) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (people < 1 || people > 4) {
            return NextResponse.json({ error: 'Invalid number of people (1-4 allowed)' }, { status: 400 });
        }

        // Breakdown validation
        if (teishokuCount === undefined || seatOnlyCount === undefined) {
            return NextResponse.json({ error: 'Missing breakdown counts' }, { status: 400 });
        }

        if (teishokuCount + seatOnlyCount !== people) {
            return NextResponse.json({ error: 'Breakdown does not match total people' }, { status: 400 });
        }

        if (teishokuCount === 0 && seatOnlyCount === 0) {
            return NextResponse.json({ error: 'Invalid breakdown' }, { status: 400 });
        }

        const validSlots = ['11:30', '12:15', '13:00'];
        if (!validSlots.includes(timeSlot)) {
            return NextResponse.json({ error: 'Invalid time slot' }, { status: 400 });
        }

        // Cut-off time check (10:00 AM JST on the same day)
        const now = new Date();
        // Convert current time to JST string for comparison
        const nowJST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
        const todayStr = nowJST.toISOString().split('T')[0];

        if (date === todayStr) {
            const currentHour = nowJST.getHours();
            // 10:00 AM check
            if (currentHour >= 10) {
                return NextResponse.json({
                    error: '当日の予約は10:00までです。お電話でお願いします。',
                    code: 'CUT_OFF'
                }, { status: 400 });
            }
        }

        // Transaction to ensure capacity
        const result = await prisma.$transaction(async (tx) => {
            // Check current capacity
            const existingReservations = await tx.reservation.findMany({
                where: {
                    date: date,
                    timeSlot: timeSlot,
                    status: {
                        in: ['CONFIRMED', 'PENDING']
                    },
                },
            });

            const currentTotal = existingReservations.reduce((sum, r) => sum + r.people, 0);

            if (currentTotal + people > 6) {
                throw new Error('Full capacity');
            }

            // Create reservation
            const newReservation = await tx.reservation.create({
                data: {
                    date,
                    timeSlot,
                    name,
                    phone,
                    // DBが未移行でemailがNOT NULLの場合に備え、空文字を保存
                    email: body?.email ?? "",
                    people,
                    teishokuCount,
                    seatOnlyCount,
                    memo,
                    status: 'CONFIRMED',
                },
            });

            return { reservation: newReservation };
        });

        // Send email notification (fire and forget)
        sendNotificationEmail(result.reservation).catch(console.error);

        return NextResponse.json(result.reservation, { status: 201 });

    } catch (error: any) {
        if (error.message === 'Full capacity') {
            return NextResponse.json({ error: 'Selected slot is full' }, { status: 409 });
        }
        console.error('Error creating reservation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
