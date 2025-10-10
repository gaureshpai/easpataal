import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || "*";

  try {
    await prisma.$connect();
    const { userIds, ...body } = await req.json();

    // ✅ Validate userIds properly
    if (
      !Array.isArray(userIds) ||
      userIds.length === 0 ||
      !userIds.every((userId) => typeof userId === "string")
    ) {
      const res = NextResponse.json(
        { error: "Invalid userIds" },
        { status: 400 }
      );
      applyCorsHeaders(res, origin);
      return res;
    }

    await Promise.all(
      userIds.map((userId: string) =>
        prisma.notificationSubscription.upsert({
          where: { patientId: userId },
          update: {subscription: body},
          create: { patientId: userId, subscription: body },
        })
      )
    );

    const res = NextResponse.json({ success: true });
    applyCorsHeaders(res, origin);
    return res;
  } catch (e) {
    console.error("POST /api/notification failed", e);
    const res = NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
    applyCorsHeaders(res, origin);
    return res;
  }
}

// ✅ Handle preflight
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || "*";
  const res = new NextResponse(null, { status: 204 });
  applyCorsHeaders(res, origin);
  return res;
}

// ✅ Helper for reusability
function applyCorsHeaders(res: NextResponse, origin: string) {
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  res.headers.set("Access-Control-Allow-Credentials", "true");
}
