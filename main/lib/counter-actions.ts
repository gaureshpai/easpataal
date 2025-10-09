"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Counter, CounterStatus } from "@prisma/client";

export interface CounterResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function createCounterAction(
  formData: FormData
): Promise<CounterResponse<Counter>> {
  try {
    const name = formData.get("name") as string;
    const location = formData.get("location") as string;
    const categoryId = formData.get("categoryId") as string;
    const departmentId = formData.get("departmentId") as string;

    if (!name || !departmentId) {
      return { success: false, error: "Required fields are missing" };
    }

    const counter = await prisma.counter.create({
      data: {
        name,
        location,
        categoryId,
        departmentId,
      },
    });

    revalidatePath("/admin/counters");

    return { success: true, data: counter };
  } catch (error) {
    console.error("Error creating counter:", error);
    return { success: false, error: "Failed to create counter" };
  } finally {
    await prisma.$disconnect();
  }
}

export async function getAllCountersAction(): Promise<
  CounterResponse<Counter[]>
> {
  try {
    const counters = await prisma.counter.findMany();

    return { success: true, data: counters };
  } catch (error) {
    console.error("Error fetching counters:", error);
    return { success: false, error: "Failed to fetch counters" };
  } finally {
    await prisma.$disconnect();
  }
}

export async function getCounterByIdAction(
  id: string
): Promise<CounterResponse<Counter>> {
  try {
    const counter = await prisma.counter.findUnique({
      where: { id },
    });

    if (!counter) {
      return { success: false, error: "Counter not found" };
    }

    return { success: true, data: counter };
  } catch (error) {
    console.error("Error fetching counter:", error);
    return { success: false, error: "Failed to fetch counter" };
  } finally {
    await prisma.$disconnect();
  }
}

export async function updateCounterAction(
  id: string,
  formData: FormData
): Promise<CounterResponse<Counter>> {
  try {
    const name = formData.get("name") as string;
    const location = formData.get("location") as string;
    const categoryId = formData.get("categoryId") as string;
    const departmentId = formData.get("departmentId") as string;
    const status = formData.get("status") as CounterStatus;

    const counter = await prisma.counter.update({
      where: { id },
      data: {
        name,
        location,
        categoryId,
        departmentId,
        status,
      },
    });

    revalidatePath("/admin/counters");

    return { success: true, data: counter };
  } catch (error) {
    console.error("Error updating counter:", error);
    return { success: false, error: "Failed to update counter" };
  } finally {
    await prisma.$disconnect();
  }
}

export async function deleteCounterAction(
  id: string
): Promise<CounterResponse<boolean>> {
  try {
    await prisma.counter.delete({
      where: { id },
    });

    revalidatePath("/admin/counters");

    return { success: true, data: true };
  } catch (error) {
    console.error("Error deleting counter:", error);
    return { success: false, error: "Failed to delete counter" };
  } finally {
    await prisma.$disconnect();
  }
}

export async function assignUserToCounterAction(
  counterId: string,
  userId: string
): Promise<CounterResponse<Counter>> {
  try {
    const counter = await prisma.counter.update({
      where: { id: counterId },
      data: { assignedUserId: userId },
    });

    revalidatePath("/admin/counters");

    return { success: true, data: counter };
  } catch (error) {
    console.error("Error assigning user to counter:", error);
    return { success: false, error: "Failed to assign user to counter" };
  } finally {
    await prisma.$disconnect();
  }
}

export async function unassignUserFromCounterAction(
  counterId: string
): Promise<CounterResponse<Counter>> {
  try {
    const counter = await prisma.counter.update({
      where: { id: counterId },
      data: { assignedUserId: null },
    });

    revalidatePath("/admin/counters");

    return { success: true, data: counter };
  } catch (error) {
    console.error("Error unassigning user from counter:", error);
    return { success: false, error: "Failed to unassign user from counter" };
  } finally {
    await prisma.$disconnect();
  }
}

export async function getAssignedCounterAction(
  userId: string
): Promise<CounterResponse<Counter>> {
  try {
    const counter = await prisma.counter.findFirst({
      where: { assignedUserId: userId },
    });

    if (!counter) {
      return { success: false, error: "No counter assigned to this user" };
    }

    return { success: true, data: counter };
  } catch (error) {
    console.error("Error fetching assigned counter:", error);
    return { success: false, error: "Failed to fetch assigned counter" };
  } finally {
    await prisma.$disconnect();
  }
}
