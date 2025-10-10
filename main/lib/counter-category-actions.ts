"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const getAllCounterCategoriesAction = async () => {
  try {
    await prisma.$connect();
    const counterCategories = await prisma.counterCategory.findMany({
      include: {
        department: true,
        _count: {
          select: { counters: true },
        },
      },
    });
    return { success: true, data: counterCategories };
  } catch (error) {
    return { success: false, error: "Failed to fetch counter categories" };
  }
};

export const createCounterCategoryAction = async (formData: FormData) => {
  try {
    const name = formData.get("name") as string;
    const departmentId = formData.get("departmentId") as string;

    const counterCategory = await prisma.counterCategory.create({
      data: {
        name,
        departmentId: departmentId || null,
      },
    });

    revalidatePath("/admin/users");
    return { success: true, data: counterCategory };
  } catch (error) {
    return { success: false, error: "Failed to create counter category" };
  }
};

export const updateCounterCategoryAction = async (id: string, formData: FormData) => {
  try {
    const name = formData.get("name") as string;
    const departmentId = formData.get("departmentId") as string;

    const counterCategory = await prisma.counterCategory.update({
      where: { id },
      data: {
        name,
        departmentId: departmentId || null,
      },
    });

    revalidatePath("/admin/users");
    return { success: true, data: counterCategory };
  } catch (error) {
    return { success: false, error: "Failed to update counter category" };
  }
};

export const deleteCounterCategoryAction = async (id: string) => {
  try {
    await prisma.counterCategory.delete({ where: { id } });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete counter category" };
  }
};