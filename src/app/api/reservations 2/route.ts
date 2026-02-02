import prisma from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

const SLOTS = ["11:30", "12:15", "13:00"] as const;
const CAPACITY_PER_SLOT = 6;

function isSameDay(a: Date, b: Date) {
  const da = new Date(a);
  const db = new Date(b);
  da.setHours(0, 0, 0, 0);
  db.setHours(0, 0, 0, 0);
  return da.getTime() === db.getTime();
}

function isCutoff(dateStr: string) {
  const today = new Date();
  const req = new Date(dateStr + 'T00:00:00');
  if (isSameDay(today, req)) {
    return today.getHours() >= 10; // 10:00以降は当日受付終了
  }
  return false;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, timeSlot, name, phone, people, teishokuCount, seatOnlyCount, memo } = body ?? {};

    if (!date || !timeSlot || !name || !phone || !people) {
      return new Response(JSON.stringify({ error: "missing required fields" }), { status: 400 });
    }
    if (!SLOTS.includes(timeSlot)) {
      return new Response(JSON.stringify({ error: "invalid timeSlot" }), { status: 400 });
    }
    const reqDate = new Date(date + 'T00:00:00');
    const weekday = reqDate.getDay();
    if (weekday === 0 || weekday === 1) {
      return new Response(JSON.stringify({ error: "closed day" }), { status: 400 });
    }
    if (isCutoff(date)) {
      return new Response(JSON.stringify({ error: "本日のWeb予約は10:00で締切です", code: "CUT_OFF" }), { status: 400 });
    }
    if (teishokuCount + seatOnlyCount !== people) {
      return new Response(JSON.stringify({ error: "内訳の合計が予約人数と一致していません" }), { status: 400 });
    }

    // 現在の埋まり具合を確認
    const existing = await prisma.reservation.findMany({
      where: { date, timeSlot, status: { in: ["CONFIRMED", "PENDING"] } },
      select: { people: true },
    });
    const used = existing.reduce((s, r) => s + r.people, 0);
    if (used + people > CAPACITY_PER_SLOT) {
      return new Response(JSON.stringify({ error: "満席のため予約できません" }), { status: 409 });
    }

    // emailがUIにないため暫定でプレースホルダ
    const email = body.email || "no-email@example.com";

    const created = await prisma.reservation.create({
      data: {
        date,
        timeSlot,
        name,
        phone,
        people,
        teishokuCount: teishokuCount ?? 0,
        seatOnlyCount: seatOnlyCount ?? 0,
        memo: memo ?? null,
        email,
        status: "CONFIRMED",
      },
    });

    // 通知メール（環境変数未設定時はログ出力）
    try { await sendNotificationEmail(created); } catch (e) { console.error(e); }

    return new Response(JSON.stringify(created), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "failed to create reservation" }), { status: 500 });
  }
}

