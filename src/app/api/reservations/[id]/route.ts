import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        await prisma.reservation.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
