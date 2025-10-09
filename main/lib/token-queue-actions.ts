"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateDisplayName } from "@/lib/helpers";

export interface TokenQueueData {
  id: string;
  tokenNumber: number;
  patientId: string;
  patientName: string;
  displayName: string | null;
  departmentId: string;
  departmentName: string;
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
  byDepartment: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface TokenQueueResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getAllActiveTokensAction(): Promise<
  TokenQueueResponse<TokenQueueData[]>
> {
  try {
    const tokens = await prisma.tokenQueue.findMany({
      include: {
        patient: true,
        department: true,
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    const tokenData: TokenQueueData[] = tokens.map((token) => ({
      id: token.id,
      tokenNumber: token.tokenNumber,
      patientId: token.patientId,
      patientName: token.patient.name,
      displayName: generateDisplayName(token.patient.name, token.tokenNumber.toString()),
      departmentId: token.departmentId,
      departmentName: token.department.name,
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
        department: true,
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    const tokenData: TokenQueueData[] = tokens.map((token) => ({
      id: token.id,
      tokenNumber: token.tokenNumber,
      patientId: token.patientId,
      patientName: token.patient.name,
      displayName: generateDisplayName(token.patient.name, token.tokenNumber.toString()),
      departmentId: token.departmentId,
      departmentName: token.department.name,
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
    const patientName = formData.get("patientName") as string;
    const departmentId = formData.get("departmentId") as string;
    const priority =
      ((formData.get("priority") as string)?.toUpperCase() as "NORMAL" | "URGENT") || "NORMAL";

    if (!patientId || !patientName || !departmentId) {
      return { success: false, error: "Required fields are missing" };
    }

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      return { success: false, error: "Department not found" };
    }

    const tokenCount = await prisma.tokenQueue.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    const tokenNumber = tokenCount + 1;
    const displayName = generateDisplayName(patientName, tokenNumber.toString());

    const queueLength = await prisma.tokenQueue.count({
      where: {
        departmentId,
        status: { in: ["WAITING", "CALLED"] },
      },
    });
    const estimatedWaitTime = Math.max(15, queueLength * 15);

    const token = await prisma.tokenQueue.create({
      data: {
        tokenNumber,
        patientId,
        patientName,
        departmentId,
        priority,
        estimatedWaitTime,
        status: "WAITING",
      },
      include: {
        patient: true,
        department: true,
      },
    });

    const tokenData: TokenQueueData = {
      id: token.id,
      tokenNumber: token.tokenNumber,
      patientId: token.patientId,
      patientName: token.patient.name,
      displayName,
      departmentId: token.departmentId,
      departmentName: token.department.name,
      status: token.status as TokenQueueData["status"],
      priority: token.priority as TokenQueueData["priority"],
      estimatedWaitTime: token.estimatedWaitTime,
      actualWaitTime: token.actualWaitTime,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt,
      calledAt: token.calledAt,
      completedAt: token.completedAt,
    };

    revalidatePath("/receptionist/token-queue");
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
    } else if (status === "COMPLETED" || status === "CANCELLED") {
      updateData.completedAt = new Date();

      const token = await prisma.tokenQueue.findUnique({
        where: { id: tokenId },
      });

      if (token) {
        const actualWaitTime = Math.floor(
          (new Date().getTime() - token.createdAt.getTime()) / (1000 * 60)
        );
        updateData.actualWaitTime = actualWaitTime;
      }
    }

    const token = await prisma.tokenQueue.update({
      where: { id: tokenId },
      data: updateData,
      include: {
        patient: true,
        department: true,
      },
    });

    const tokenData: TokenQueueData = {
      id: token.id,
      tokenNumber: token.tokenNumber,
      patientId: token.patientId,
      patientName: token.patient.name,
      displayName: generateDisplayName(token.patient.name, token.tokenNumber.toString()),
      departmentId: token.departmentId,
      departmentName: token.department.name,
      status: token.status as TokenQueueData["status"],
      priority: token.priority as TokenQueueData["priority"],
      estimatedWaitTime: token.estimatedWaitTime,
      actualWaitTime: token.actualWaitTime,
      createdAt: token.createdAt,
      updatedAt: token.updatedAt,
      calledAt: token.calledAt,
      completedAt: token.completedAt,
    };

    revalidatePath("/receptionist/token-queue");
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

    revalidatePath("/receptionist/token-queue");
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
      include: { department: true },
    });

    const totalTokens = tokens.length;
    const waitingTokens = tokens.filter((t) => t.status === "WAITING").length;
    const inProgressTokens = tokens.filter((t) => t.status === "WAITING").length;
    const completedTokens = tokens.filter((t) => t.status === "COMPLETED").length;

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

    const byDepartment = tokens.reduce((acc, token) => {
      acc[token.department.name] = (acc[token.department.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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
      byDepartment,
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