"use server";

import  prisma  from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const getAllCountersAction = async () => {
  try {
    const counters = await prisma.counter.findMany();
    return { success: true, data: counters };
  } catch (error) {
    return { success: false, error: "Failed to fetch counters" };
  }
};

export const getCountersAction = async () => {
  try {
    const counters = await prisma.counter.findMany();
    return { success: true, data: counters };
  } catch (error) {
    return { success: false, error: "Failed to fetch counters" };
  }
};

export const getCounterCategoryAction = async () => {
  try {
    const counters = await prisma.counterCategory.findMany();
    return { success: true, data: counters };
  } catch (error) {
    return { success: false, error: "Failed to fetch counters" };
  }
};

export const createCounterAction = async (formData: FormData) => {
  try {
    const name = formData.get("name") as string;
    const location = formData.get("location") as string;
    const status = formData.get("status") as string;

    const counter = await prisma.counter.create({
      data: {
        name,
        location,
        status: status as any,
      },
    });

    revalidatePath("/admin/counters");
    return { success: true, data: counter };
  } catch (error) {
    return { success: false, error: "Failed to create counter" };
  }
};

export const updateCounterAction = async (id: string, formData: FormData) => {
  try {
    const name = formData.get("name") as string;
    const location = formData.get("location") as string;
    const status = formData.get("status") as string;

    const counter = await prisma.counter.update({
      where: { id },
      data: {
        name,
        location,
        status: status as any,
      },
    });

    revalidatePath("/admin/counters");
    return { success: true, data: counter };
  } catch (error) {
    return { success: false, error: "Failed to update counter" };
  }
};

export const deleteCounterAction = async (id: string) => {
  try {
    await prisma.counter.delete({ where: { id } });
    revalidatePath("/admin/counters");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete counter" };
  }
};
