"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateDisplayName } from "@/lib/helpers";
import { sendNotification } from "@/lib/notifications";
import sendSMS from "./twillio";

export interface TokenQueueData {
  id: string;
  tokenNumber: number;
  patientId: string;
  patientName: string;
  displayName: string | null;
  status: "WAITING" | "CALLED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority: "NORMAL" | "URGENT";
  estimatedWaitTime: number;
  actualWaitTime: number | null;
  createdAt: Date;
  updatedAt: Date;
  calledAt: Date | null;
  completedAt: Date | null;
}

export interface TokenQueueStats {
  totalTokens: number;
  waitingTokens: number;
  inProgressTokens: number;
  completedTokens: number;
  averageWaitTime: number;
  byPriority: Record<string, number>;
}

export interface TokenQueueResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getTokensByCounterIdAction(
  counterId: string
): Promise<TokenQueueResponse<TokenQueueData[]>> {
  try {
    const tokens = await prisma.tokenQueue.findMany({
      where: {
        counterId: counterId,
        status: { in: ["WAITING", "CALLED"] },
      },
      include: {
        patient: true,
        counter: {
          include: {
            department: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    const tokenData: TokenQueueData[] = tokens.map((token) => ({
      id: token.id,
      tokenNumber: token.tokenNumber,
      patientId: token.patientId,
      patientName: token.patient.name,
      displayName: generateDisplayName(
        token.patient.name,
        token.tokenNumber.toString()
      ),
      departmentId: token.counter?.departmentId || "N/A",
      departmentName: token.counter?.department?.name || "N/A",
      status: token.status as TokenQueueData["status"],
      priority: token.priority as TokenQueueData["priority"],
      estimatedWaitTime: token.estimatedWaitTime,
      actualWaitTime: token.actualWaitTime,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt,
      calledAt: token.calledAt,
      completedAt: token.completedAt,
    }));

    return { success: true, data: tokenData };
  } catch (error) {
    console.error(`Error fetching tokens for counter ${counterId}:`, error);
    return { success: false, error: `Failed to fetch tokens for counter ${counterId}` };
  } finally {
    await prisma.$disconnect();
  }
}

export async function getAllActiveTokensAction(): Promise<
  TokenQueueResponse<TokenQueueData[]>
> {
  try {
    const tokens = await prisma.tokenQueue.findMany({
      include: {
        patient: true,
        counter: {
          include: {
            department: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    const tokenData: TokenQueueData[] = tokens.map((token) => ({
      id: token.id,
      tokenNumber: token.tokenNumber,
      patientId: token.patientId,
      patientName: token.patient.name,
      displayName: generateDisplayName(
        token.patient.name,
        token.tokenNumber.toString()
      ),
      departmentId: token.counter?.departmentId || "N/A",
      departmentName: token.counter?.department?.name || "N/A",
      status: token.status as TokenQueueData["status"],
      priority: token.priority as TokenQueueData["priority"],
      estimatedWaitTime: token.estimatedWaitTime,
      actualWaitTime: token.actualWaitTime,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt,
      calledAt: token.calledAt,
      completedAt: token.completedAt,
    }));

    return { success: true, data: tokenData };
  } catch (error) {
    console.error("Error fetching active tokens:", error);
    return { success: false, error: "Failed to fetch active tokens" };
  } finally {
    await prisma.$disconnect();
  }
}

export async function getTokenQueueByDepartmentAction(
  departmentId: string
): Promise<TokenQueueResponse<TokenQueueData[]>> {
  try {
    const whereClause = departmentId === "all" ? {} : { departmentId };

    const tokens = await prisma.tokenQueue.findMany({
      where: {
        ...whereClause,
        status: { in: ["WAITING", "CALLED"] },
      },
      include: {
        patient: true,
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    const tokenData: TokenQueueData[] = tokens.map((token) => ({
      id: token.id,
      tokenNumber: token.tokenNumber,
      patientId: token.patientId,
      patientName: token.patient.name,
      displayName: generateDisplayName(
        token.patient.name,
        token.tokenNumber.toString()
      ),
      status: token.status as TokenQueueData["status"],
      priority: token.priority as TokenQueueData["priority"],
      estimatedWaitTime: token.estimatedWaitTime,
      actualWaitTime: token.actualWaitTime,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt,
      calledAt: token.calledAt,
      completedAt: token.completedAt,
    }));

    return { success: true, data: tokenData };
  } catch (error) {
    console.error("Error fetching tokens by department:", error);
    return { success: false, error: "Failed to fetch tokens by department" };
  } finally {
    await prisma.$disconnect();
  }
}

export async function createTokenAction(
  formData: FormData
): Promise<TokenQueueResponse<TokenQueueData>> {
  try {
    const patientId = formData.get("patientId") as string;
    const counterCategoryId = formData.get("counterId") as string;
    const priority =
      ((formData.get("priority") as string)?.toUpperCase() as
        | "NORMAL"
        | "URGENT") || "NORMAL";

    if (!patientId || !counterCategoryId) {
      return { success: false, error: "Required fields are missing" };
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { name: true },
    });

    if (!patient) {
      return { success: false, error: "Patient not found" };
    }

    const patientName = patient.name;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allCompletedTokens = await prisma.tokenQueue.findMany({
        where: {
            status: "COMPLETED",
            actualWaitTime: { not: null },
            createdAt: { gte: today }
        }
    });

    const globalTotalWaitTime = allCompletedTokens.reduce((sum, token) => sum + token.actualWaitTime!, 0);
    const globalAverageWaitTime = allCompletedTokens.length > 0 ? globalTotalWaitTime / allCompletedTokens.length : 15;

    const counters = await prisma.counter.findMany({
      where: {
        categoryId: counterCategoryId,
        status: "ACTIVE",
      },
      include: {
        tokens: {
          where: {
            createdAt: { gte: today },
            status: { in: ["WAITING", "CALLED", "COMPLETED"] },
          },
          select: {
            status: true,
            actualWaitTime: true,
          },
        },
      },
    });

    if (counters.length === 0) {
      return {
        success: false,
        error: "No active counters found for this category",
      };
    }

    let bestCounterId: string | null = null;
    let minWaitingTimeScore = Infinity;

    for (const counter of counters) {
      const waitingTokens = counter.tokens.filter(
        (token) => token.status === "WAITING" || token.status === "CALLED"
      ).length;

      const completedTokensToday = counter.tokens.filter(
        (token) => token.status === "COMPLETED" && token.actualWaitTime !== null
      );

      const totalActualWaitTime = completedTokensToday.reduce(
        (sum, token) => sum + (token.actualWaitTime || 0),
        0
      );

      const averageWaitTime =
        completedTokensToday.length > 0
          ? totalActualWaitTime / completedTokensToday.length
          : globalAverageWaitTime;

      const waitingTimeScore = averageWaitTime * waitingTokens;

      if (waitingTimeScore < minWaitingTimeScore) {
        minWaitingTimeScore = waitingTimeScore;
        bestCounterId = counter.id;
      }
    }

    if (!bestCounterId) {
      return { success: false, error: "Could not assign a counter" };
    }

    const tokenCount = await prisma.tokenQueue.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    const tokenNumber = tokenCount + 1;
    const displayName = generateDisplayName(
      patientName,
      tokenNumber.toString()
    );

    const queueLength = await prisma.tokenQueue.count({
      where: {
        counterId: bestCounterId,
        status: { in: ["WAITING", "CALLED"] },
      },
    });
    const estimatedWaitTime = Math.max(15, queueLength * 15);

    const token = await prisma.tokenQueue.create({
      data: {
        tokenNumber,
        patientId,
        counterId: bestCounterId,
        priority,
        estimatedWaitTime,
        status: "WAITING",
      },
      include: {
        patient: true,
        counter: {
          include: {
            category: true,
            department: true,
          },
        },
      },
    });

    const tokenData: TokenQueueData = {
      id: token.id,
      tokenNumber: token.tokenNumber,
      patientId: token.patientId,
      patientName: token.patient.name,
      displayName,
      status: token.status as TokenQueueData["status"],
      priority: token.priority as TokenQueueData["priority"],
      estimatedWaitTime: token.estimatedWaitTime,
      actualWaitTime: token.actualWaitTime,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt,
      calledAt: token.calledAt,
      completedAt: token.completedAt,
    };
    const subscription = await prisma.notificationSubscription.findUnique({
      where: { patientId },
    });
    if (
      !subscription ||
      !subscription.subscription ||
      !(subscription.subscription as any)?.subscription
    ) {
      return { success: true, data: tokenData };
    }

    console.log("Subscription found:", subscription);
    await sendNotification(
      (subscription.subscription as any)?.subscription,
      JSON.stringify({
        title: "Token Created",
        body: "Your token is created successfully!",
        badge: "http://10.28.152.189:3000/logo.png",
        image: "http://10.28.152.189:3000/logo.png",
        data: {
          userId: patientId,
        },
      })
    );
    revalidatePath("/receptionist");
    revalidatePath("/display");

    return { success: true, data: tokenData };
  } catch (error) {
    console.error("Error creating token:", error);
    return { success: false, error: "Failed to create token" };
  } finally {
    await prisma.$disconnect();
  }
}

export async function updateTokenStatusAction(
  tokenId: string,
  status: TokenQueueData["status"]
): Promise<TokenQueueResponse<TokenQueueData>> {
  try {
    const updateData: any = { status };

    if (status === "CALLED") {
      updateData.calledAt = new Date();
      const token = await prisma.tokenQueue.findUnique({
        where: { id: tokenId },
      });
      if (token) {
        const actualWaitTime = Math.floor(
          (updateData.calledAt.getTime() - token.createdAt.getTime()) / (1000 * 60)
        );
        updateData.actualWaitTime = actualWaitTime;
      }
    } else if (status === "COMPLETED" || status === "CANCELLED") {
      updateData.completedAt = new Date();
    }

    const token = await prisma.tokenQueue.update({
      where: { id: tokenId },
      data: updateData,
      include: {
        patient: {
          include: {
            NotificationSubscription: true,
          },
        },
      },
    });

    if (token.status == "COMPLETED") {
      const subscription = token.patient.NotificationSubscription;
      if (subscription && subscription.subscription) {
        await sendNotification(
          subscription.subscription as any,
          JSON.stringify({
            title: "Token Completed",
            body: `Your token ${token.tokenNumber} is completed.`,
            badge: "http://10.28.152.189:3000/logo.png",
            image: "http://10.28.152.189:3000/logo.png",
            data: {
              userId: token.patientId,
            },
          })
        );
      }
    }

    // Send notification to the patient of the updated token if it's called
    if (token.status === "CALLED") {
      const subscription = token.patient.NotificationSubscription;
      if (subscription && subscription.subscription) {
        await sendNotification(
          subscription.subscription as any,
          JSON.stringify({
            title: "Your Turn!",
            body: `Your token ${token.tokenNumber} is now being called.`,
            badge: "http://10.28.152.189:3000/logo.png",
            image: "http://10.28.152.189:3000/logo.png",
            data: {
              userId: token.patientId,
            },
          })
        );
      }
    }

    // Notification logic for tokens close to being called
    if (token.counterId) {
      const waitingTokens = await prisma.tokenQueue.findMany({
        where: {
          counterId: token.counterId,
          status: "WAITING",
        },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        include: {
          patient: {
            include: {
              NotificationSubscription: true,
            },
          },
        },
      });

      for (let i = 0; i < waitingTokens.length; i++) {
        const currentWaitingToken = waitingTokens[i];
        const position = i + 1;
        if(position==3 && currentWaitingToken.patient.phone){
          sendSMS(currentWaitingToken.patient.phone, `Your token is ${position} away from being called!`)
        }
        if ([1, 2, 3, 5].includes(position)) {
          const subscription =
            currentWaitingToken.patient.NotificationSubscription;
          if (subscription && subscription.subscription) {
            const message = `Your token is ${position} away from being called!`;
            await sendNotification(
              subscription.subscription as any,
              JSON.stringify({
                title: "Token Update",
                body: message,
                badge: "http://10.28.152.189:3000/logo.png",
                image: "http://10.28.152.189:3000/logo.png",
                data: {
                  userId: currentWaitingToken.patient.id,
                },
              })
            );
          }
        }
      }
    }

    const tokenData: TokenQueueData = {
      id: token.id,
      tokenNumber: token.tokenNumber,
      patientId: token.patientId,
      patientName: token.patient.name,
      displayName: generateDisplayName(
        token.patient.name,
        token.tokenNumber.toString()
      ),
      status: token.status as TokenQueueData["status"],
      priority: token.priority as TokenQueueData["priority"],
      estimatedWaitTime: token.estimatedWaitTime,
      actualWaitTime: token.actualWaitTime,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt,
      calledAt: token.calledAt,
      completedAt: token.completedAt,
    };

    revalidatePath("/receptionist");
    revalidatePath("/display");

    return { success: true, data: tokenData };
  } catch (error) {
    console.error("Error updating token status:", error);
    return { success: false, error: "Failed to update token status" };
  } finally {
    await prisma.$disconnect();
  }
}

export async function cancelTokenAction(
  tokenId: string
): Promise<TokenQueueResponse<boolean>> {
  try {
    await updateTokenStatusAction(tokenId, "CANCELLED");

    revalidatePath("/receptionist");
    revalidatePath("/display");

    return { success: true, data: true };
  } catch (error) {
    console.error("Error cancelling token:", error);
    return { success: false, error: "Failed to cancel token" };
  } finally {
    await prisma.$disconnect();
  }
}

export async function getTokenQueueStatsAction(): Promise<
  TokenQueueResponse<TokenQueueStats>
> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tokens = await prisma.tokenQueue.findMany({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    const totalTokens = tokens.length;
    const waitingTokens = tokens.filter((t) => t.status === "WAITING").length;
    const inProgressTokens = tokens.filter(
      (t) => t.status === "WAITING"
    ).length;
    const completedTokens = tokens.filter(
      (t) => t.status === "COMPLETED"
    ).length;

    const completedWithWaitTime = tokens.filter(
      (t) => t.status === "COMPLETED" && t.actualWaitTime !== null
    );
    const averageWaitTime =
      completedWithWaitTime.length > 0
        ? completedWithWaitTime.reduce(
            (sum, t) => sum + (t.actualWaitTime || 0),
            0
          ) / completedWithWaitTime.length
        : 0;

    const byPriority = tokens.reduce((acc, token) => {
      acc[token.priority] = (acc[token.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const stats: TokenQueueStats = {
      totalTokens,
      waitingTokens,
      inProgressTokens,
      completedTokens,
      averageWaitTime,
      byPriority,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error("Error calculating token queue stats:", error);
    return {
      success: false,
      error: "Failed to calculate token queue statistics",
    };
  } finally {
    await prisma.$disconnect();
  }
}

export async function callNextTokenAction(
  doctorId: string
): Promise<TokenQueueResponse<TokenQueueData>> {
  try {
    // 1. Find the counterId associated with the doctorId
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      include: {
        counter: true,
      },
    });

    if (!doctor || !doctor.counter) {
      return {
        success: false,
        error: "Doctor or associated counter not found.",
      };
    }

    const counterId = doctor.counter.id;

    // 2. Find the next WAITING token for that counterId
    const nextToken = await prisma.tokenQueue.findFirst({
      where: {
        counterId: counterId,
        status: "WAITING",
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    if (!nextToken) {
      return {
        success: false,
        error: "No waiting tokens found for this counter.",
      };
    }

    // 3. Update its status to "CALLED" using updateTokenStatusAction
    const updateResult = await updateTokenStatusAction(nextToken.id, "CALLED");

    if (!updateResult.success || !updateResult.data) {
      return {
        success: false,
        error: updateResult.error || "Failed to update token status.",
      };
    }

    revalidatePath("/doctor/patients"); // Revalidate the doctor's patient page
    revalidatePath("/display"); // Revalidate the display page

    return { success: true, data: updateResult.data };
  } catch (error) {
    console.error("Error calling next token:", error);
    return { success: false, error: "Failed to call next token." };
  } finally {
    await prisma.$disconnect();
  }
}
