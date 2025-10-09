import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, res: NextResponse) {
  const { userIds, ...body } = await req.json();

  if (
    Array.isArray(userIds) &&
    userIds.length > 0 &&
    userIds.every((userId) => typeof userId === "string")
  ) {
    return NextResponse.json({ error: "Invalid userIds" }, { status: 400 });
  }

  await Promise.all(
    userIds.map((userId: string) =>
      prisma.notificationSubscription.upsert({
        where: { userId },
        update: body,
        create: body,
      })
    )
  );

  return NextResponse.json({ success: true });
}
