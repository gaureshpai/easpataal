"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const getAllCountersAction = async () => {
  try {
    const counters = await prisma.counter.findMany({
      include: {
        assignedUser: true,
        category: true,
      },
    });
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
    const assignedUserId = formData.get("assignedUserId") as string;
    const categoryId = formData.get("categoryId") as string;

    if (assignedUserId) {
      const user = await prisma.user.findUnique({
        where: { id: assignedUserId },
      });

      if (user?.counterId) {
        return {
          success: false,
          error: "This doctor is already assigned to another counter.",
        };
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const counter = await tx.counter.create({
        data: {
          name,
          location,
          status: status as any,
          assignedUserId: assignedUserId || null,
          categoryId: categoryId || null,
        },
      });

      if (assignedUserId) {
        await tx.user.update({
          where: { id: assignedUserId },
          data: { counterId: counter.id },
        });
      }
      return counter;
    });

    revalidatePath("/admin/counters");
    return { success: true, data: result };
  } catch (error) {
    console.error(error); // It's good practice to log the actual error.
    return { success: false, error: "Failed to create counter" };
  }
};

export const updateCounterAction = async (id: string, formData: FormData) => {
  try {
    const name = formData.get("name") as string;
    const location = formData.get("location") as string;
    const status = formData.get("status") as string;
    const newAssignedUserId = (formData.get("assignedUserId") as string) || null; // Ensure it's null if empty
    const categoryId = formData.get("categoryId") as string;

    // Check if the new user is already assigned elsewhere
    if (newAssignedUserId) {
      const user = await prisma.user.findUnique({
        where: { id: newAssignedUserId },
      });

      // If user is assigned to a counter, and that counter is not the one we are currently editing
      if (user?.counterId && user.counterId !== id) {
        return {
          success: false,
          error: "This doctor is already assigned to another counter.",
        };
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get the current state of the counter before updating
      const currentCounter = await tx.counter.findUnique({
        where: { id },
      });
      const oldAssignedUserId = currentCounter?.assignedUserId;

      // If the user assignment has changed
      if (oldAssignedUserId !== newAssignedUserId) {
        // 1. Unassign the old user if there was one
        if (oldAssignedUserId) {
          await tx.user.update({
            where: { id: oldAssignedUserId },
            data: { counterId: null },
          });
        }
        // 2. Assign the new user if there is one
        if (newAssignedUserId) {
          await tx.user.update({
            where: { id: newAssignedUserId },
            data: { counterId: id },
          });
        }
      }

      // 3. Update the counter itself
      const updatedCounter = await tx.counter.update({
        where: { id },
        data: {
          name,
          location,
          status: status as any,
          assignedUserId: newAssignedUserId,
          categoryId: categoryId || null,
        },
      });

      return updatedCounter;
    });

    revalidatePath("/admin/counters");
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to update counter" };
  }
};

export const deleteCounterAction = async (id: string) => {
  try {
    await prisma.$transaction(async (tx) => {
      const counter = await tx.counter.findUnique({ where: { id } });
      if (counter?.assignedUserId) {
        await tx.user.update({
          where: { id: counter.assignedUserId },
          data: { counterId: null },
        });
      }
      await tx.counter.delete({ where: { id } });
    });

    revalidatePath("/admin/counters");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete counter" };
  }
};

