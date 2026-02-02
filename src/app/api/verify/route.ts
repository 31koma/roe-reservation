import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const actionToken = await tx.actionToken.findUnique({
                where: { token },
                include: { reservation: true },
            });

            if (!actionToken) {
                throw new Error('Invalid token');
            }

            if (actionToken.expiresAt < new Date()) {
                throw new Error('Token expired');
            }

            // If already processed (though we delete token, race condition check)
            if (actionToken.reservation.status !== 'PENDING') {
                // If already confirmed/rejected, just return info
                return { status: actionToken.reservation.status, alreadyProcessed: true };
            }

            let newStatus = '';
            if (actionToken.action === 'APPROVE') {
                newStatus = 'CONFIRMED';
            } else if (actionToken.action === 'REJECT') {
                newStatus = 'REJECTED';
            }

            await tx.reservation.update({
                where: { id: actionToken.reservationId },
                data: { status: newStatus },
            });

            // Delete ALL tokens for this reservation to prevent double action
            await tx.actionToken.deleteMany({
                where: { reservationId: actionToken.reservationId },
            });

            return { status: newStatus, alreadyProcessed: false };
        });

        return NextResponse.json(result);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
