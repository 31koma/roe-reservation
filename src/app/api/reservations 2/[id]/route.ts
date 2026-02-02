import prisma from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return new Response(null, { status: 400 });

    const exists = await prisma.reservation.findUnique({ where: { id } });
    if (!exists) return new Response(null, { status: 404 });

    // 物理削除ではなくステータス変更で運用
    await prisma.reservation.update({ where: { id }, data: { status: "CANCELLED" } });
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return new Response(null, { status: 500 });
  }
}

