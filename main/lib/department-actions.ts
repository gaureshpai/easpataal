"use server"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const getDepartmentsAction = async () => {
  try {
    const departments = await prisma.department.findMany()
    return { success: true, data: departments }
  } catch (error) {
    return { success: false, error: "Failed to fetch departments" }
  }
}
