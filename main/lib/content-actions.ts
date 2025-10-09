"use server"

import prisma from "@/lib/prisma"

export interface AnalyticsData {
  displays: {
    total: number
    online: number
    offline: number
  }
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
    averageWaitTime: number
    tokensProcessedToday: number
    activeCounters: number
  }
}

export interface ActionResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export async function getSystemAnalyticsAction(): Promise<ActionResponse<AnalyticsData>> {
  try {
    // Fetch display statistics
    const displays = await prisma.display.findMany({
      select: {
        status: true,
      },
    })

    const displayStats = {
      total: displays.length,
      online: displays.filter(d => d.status === 'ONLINE').length,
      offline: displays.filter(d => d.status === 'OFFLINE').length,
    }

    // Fetch patient statistics
    const patients = await prisma.patient.findMany({
      select: {
        status: true,
      },
    })

    const patientStats = {
      total: patients.length,
      active: patients.filter(p => p.status === 'ACTIVE').length,
    }

    // Fetch token queue statistics
    const tokens = await prisma.tokenQueue.findMany({
      select: {
        status: true,
        createdAt: true,
        completedAt: true,
        estimatedWaitTime: true,
      },
    })

    const today = new Date()
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
    const completedTokensWithTime = tokens.filter(
      t => t.status === 'COMPLETED' && t.completedAt && t.createdAt
    )

    let averageWaitTime = 0
    if (completedTokensWithTime.length > 0) {
      const totalWaitTime = completedTokensWithTime.reduce((sum, token) => {
        const waitTime = token.completedAt && token.createdAt
          ? (token.completedAt.getTime() - token.createdAt.getTime()) / 60000 // Convert to minutes
          : 0
        return sum + waitTime
      }, 0)
      averageWaitTime = Math.round(totalWaitTime / completedTokensWithTime.length)
    }

    // Fetch active counters
    const counters = await prisma.counter.findMany({
      select: {
        status: true,
      },
    })

    const activeCounters = counters.filter(c => c.status === 'ACTIVE').length

    const analyticsData: AnalyticsData = {
      displays: displayStats,
      patients: patientStats,
      tokens: tokenStats,
      departments: departmentStats,
      performance: {
        averageWaitTime,
        tokensProcessedToday: tokensToday.length,
        activeCounters,
      },
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
      include: {
        tokenQueue: {
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        },
        counters: {
          where: {
            status: 'ACTIVE',
          },
        },
      },
    })

    if (!department) {
      return {
        success: false,
        error: "Department not found",
      }
    }

    const analytics = {
      name: department.name,
      location: department.location,
      totalTokensToday: department.tokenQueue.length,
      waitingTokens: department.tokenQueue.filter(t => t.status === 'WAITING').length,
      completedTokens: department.tokenQueue.filter(t => t.status === 'COMPLETED').length,
      activeCounters: department.counters.length,
      currentOccupancy: department.currentOccupancy,
      capacity: department.capacity,
      occupancyRate: Math.round((department.currentOccupancy / department.capacity) * 100),
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