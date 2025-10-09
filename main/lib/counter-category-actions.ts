"use server"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const getCounterCategoriesAction = async () => {
  try {
    const counterCategories = await prisma.counterCategory.findMany()
    return { success: true, data: counterCategories }
  } catch (error) {
    return { success: false, error: "Failed to fetch counter categories" }
  }
}
