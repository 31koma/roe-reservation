import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    if (!date) {
      return new Response(JSON.stringify({ error: "date is required" }), { status: 400 });
    }

    const reservations = await prisma.reservation.findMany({
      where: { date },
      orderBy: [{ timeSlot: "asc" }, { createdAt: "asc" }],
    });

    return new Response(JSON.stringify(reservations), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "failed to fetch reservations" }), { status: 500 });
  }
}

