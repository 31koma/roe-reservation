import prisma from "@/lib/prisma";

const SLOTS = ["11:30", "12:15", "13:00"] as const;
const CAPACITY_PER_SLOT = 6;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    if (!date) {
      return new Response(JSON.stringify({ error: "date is required" }), { status: 400 });
    }

    // Aggregate reservation counts per slot (only active statuses)
    const reservations = await prisma.reservation.findMany({
      where: {
        date,
        status: { in: ["CONFIRMED", "PENDING"] },
      },
      select: { timeSlot: true, people: true },
    });

    const used: Record<string, number> = {};
    for (const slot of SLOTS) used[slot] = 0;
    for (const r of reservations) {
      used[r.timeSlot] = (used[r.timeSlot] ?? 0) + r.people;
    }

    const availability: Record<string, number> = {};
    for (const slot of SLOTS) {
      availability[slot] = Math.max(0, CAPACITY_PER_SLOT - (used[slot] ?? 0));
    }

    return new Response(JSON.stringify(availability), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "failed to fetch availability" }), { status: 500 });
  }
}

