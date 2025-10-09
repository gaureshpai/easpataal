"use server"

import prisma from "@/lib/prisma"

export interface AnalyticsData {
  patients: {
    total: number
    active: number
  }
  tokens: {
    waiting: number
    called: number
    completed: number
    total: number
  }
  departments: {
    total: number
    active: number
  }
  performance: {
    averageWaitTime: number;
    tokensProcessedToday: number;
    activeCounters: number;
    peakHour: string;
    busiestCounter: { name: string; count: number } | null;
  };
  counters: any[];
}

export interface ActionResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export async function getSystemAnalyticsAction(): Promise<ActionResponse<AnalyticsData>> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dailyPatients = await prisma.patient.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const yesterdayPatients = await prisma.patient.count({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });

    const patientStats = {
      total: await prisma.patient.count(),
      active: await prisma.patient.count({ where: { status: 'ACTIVE' } }),
      daily: dailyPatients,
      change: dailyPatients - yesterdayPatients,
    };

    // Fetch token queue statistics
    const tokens = await prisma.tokenQueue.findMany({
      select: {
        status: true,
        createdAt: true,
        completedAt: true,
        calledAt: true,
        estimatedWaitTime: true,
      },
    })

    today.setHours(0, 0, 0, 0)

    const tokensToday = tokens.filter(t => t.createdAt >= today)

    const tokenStats = {
      waiting: tokens.filter(t => t.status === 'WAITING').length,
      called: tokens.filter(t => t.status === 'CALLED').length,
      completed: tokens.filter(t => t.status === 'COMPLETED').length,
      total: tokens.length,
    }

    // Fetch department statistics
    const departments = await prisma.department.findMany({
      select: {
        status: true,
      },
    })

    const departmentStats = {
      total: departments.length,
      active: departments.filter(d => d.status === 'ACTIVE').length,
    }

    // Calculate average wait time
    const calledTokensWithTime = tokens.filter(
      t => t.status === 'CALLED' && t.calledAt && t.createdAt
    )

    let averageWaitTime = 0
    if (calledTokensWithTime.length > 0) {
      const totalWaitTime = calledTokensWithTime.reduce((sum, token) => {
        const waitTime = token.calledAt && token.createdAt
          ? (token.calledAt.getTime() - token.createdAt.getTime()) / 60000 // minutes
          : 0
        return sum + waitTime
      }, 0)
      averageWaitTime = Math.round(totalWaitTime / calledTokensWithTime.length)
    }

    // Fetch active counters
    const counters = await prisma.counter.findMany({
      select: {
        status: true,
      },
    })

    const activeCounters = counters.filter(c => c.status === 'ACTIVE').length

    // busiest counter
    const tokenCounts = await prisma.tokenQueue.groupBy({
      by: ['counterId'],
      _count: {
        counterId: true,
      },
      where: {
        counterId: { not: null },
      },
    });

    let busiestCounter: { name: string; count: number } | null = null;
    if (tokenCounts.length > 0) {
      const busiestCounterId = tokenCounts.reduce((max, current) => {
        return (current._count.counterId ?? 0) > (max._count.counterId ?? 0) ? current : max;
      });

      const counterInfo = await prisma.counter.findUnique({
        where: { id: busiestCounterId.counterId! },
      });

      if (counterInfo) {
        busiestCounter = {
          name: counterInfo.name,
          count: busiestCounterId._count.counterId ?? 0,
        };
      }
    }

    // peak hour
    const tokensWithHour = tokens.map(t => ({
      ...t,
      hour: new Date(t.createdAt).getHours(),
    }));

    const hourCounts = tokensWithHour.reduce((acc, token) => {
      acc[token.hour] = (acc[token.hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const formatHour = (hour: number) => {
      const h = hour % 12 || 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      return `${h}:00 ${ampm}`;
    };

    const peakHour = Object.keys(hourCounts).reduce((a, b) => hourCounts[parseInt(a)] > hourCounts[parseInt(b)] ? a : b, '0');
    const peakHourInt = parseInt(peakHour);

    const analyticsData: AnalyticsData = {
      patients: patientStats,
      tokens: tokenStats,
      departments: departmentStats,
      performance: {
        averageWaitTime,
        tokensProcessedToday: tokensToday.length,
        activeCounters,
        peakHour: `${formatHour(peakHourInt)} - ${formatHour(peakHourInt + 1)}`,
        busiestCounter,
      },
      counters: await prisma.counter.findMany({ include: { assignedUser: true, category: true } }),
    }

    return {
      success: true,
      data: analyticsData,
    }
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return {
      success: false,
      error: "Failed to fetch analytics data",
    }
  } finally {
    await prisma.$disconnect()
  }
}

export async function getDepartmentAnalyticsAction(departmentId: string): Promise<ActionResponse<any>> {
  try {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    })

    if (!department) {
      return {
        success: false,
        error: "Department not found",
      }
    }

    const tokenQueues = await prisma.tokenQueue.findMany({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    })

    const counters = await prisma.counter.findMany({
      where: {
        departmentId: departmentId,
        status: 'ACTIVE',
      },
    })

    const analytics = {
      name: department.name,
      totalTokensToday: tokenQueues.length,
      waitingTokens: tokenQueues.filter(t => t.status === 'WAITING').length,
      completedTokens: tokenQueues.filter(t => t.status === 'COMPLETED').length,
      activeCounters: counters.length,
    }

    return {
      success: true,
      data: analytics,
    }
  } catch (error) {
    console.error("Error fetching department analytics:", error)
    return {
      success: false,
      error: "Failed to fetch department analytics",
    }
  } finally {
    await prisma.$disconnect()
  }
}