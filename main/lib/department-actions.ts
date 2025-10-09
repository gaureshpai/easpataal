"use server"

import { Department } from "@prisma/client";
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type DepartmentData = {
    id: string;
    name: string;
    status: "ACTIVE" | "INACTIVE";
    counters?: any[]; // You might want to define a proper type for counters
    counterCategories?: any[]; // You might want to define a proper type for counterCategories
};
  
export type DepartmentResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
};

export type DepartmentStats = {
    totalDepartments: number;
    activeDepartments: number;
    byStatus: Record<string, number>;
};


export async function createDepartmentAction(formData: FormData): Promise<DepartmentResponse<any>> {
    try {
        const name = formData.get("name") as string;

        if (!name) {
            return { success: false, error: "Required fields are missing" };
        }

        const department = await prisma.department.create({
            data: {
                name,
            },
        });

        revalidatePath("/admin/users");

        return { success: true, data: department };
    } catch (error) {
        console.error("Error creating department:", error);
        return { success: false, error: "Failed to create department" };
    } finally {
        await prisma.$disconnect();
    }
}

export async function updateDepartmentAction(
    id: string,
    formData: FormData,
): Promise<DepartmentResponse<any>> {
    try {
        const name = formData.get("name") as string
        const status = formData.get("status") as "ACTIVE" | "INACTIVE"

        const department = await prisma.department.update({
            where: { id },
            data: {
                name,
                status,
            },
        })

        const departmentData: DepartmentData = {
            id: department.id,
            name: department.name,
            status: department.status,
        }

        revalidatePath("/admin/departments")

        return { success: true, data: departmentData }
    } catch (error) {
        console.error("Error updating department:", error)
        return { success: false, error: "Failed to update department" }
    } finally {
        await prisma.$disconnect()
    }
}

export async function deleteDepartmentAction(id: string): Promise<DepartmentResponse<any>> {
    try {
        await prisma.department.delete({
            where: { id },
        })

        revalidatePath("/admin/departments")

        return { success: true, data: true }
    } catch (error) {
        console.error("Error deleting department:", error)
        return { success: false, error: "Failed to delete department" }
    } finally {
        await prisma.$disconnect()
    }
}

export async function getDepartmentStatsAction(): Promise<DepartmentResponse<any>> {
    try {
        const departments = await prisma.department.findMany()

        const totalDepartments = departments.length
        const activeDepartments = departments.filter((dept) => dept.status === "ACTIVE").length

        const byStatus = departments.reduce(
            (acc, dept) => {
                acc[dept.status] = (acc[dept.status] || 0) + 1
                return acc
            },
            {} as Record<string, number>,
        )

        const stats: DepartmentStats = {
            totalDepartments,
            activeDepartments,
            byStatus,
        }

        return { success: true, data: stats }
    } catch (error) {
        console.error("Error calculating department stats:", error)
        return { success: false, error: "Failed to calculate department statistics" }
    } finally {
        await prisma.$disconnect()
    }
}

export async function getAllDepartmentsAction(): Promise<DepartmentResponse<Department[]>> {
    try {
        const departments = await prisma.department.findMany();
        return { success: true, data: departments };
    } catch (error) {
        console.error("Error getting all departments:", error);
        return { success: false, error: "Failed to get all departments" };
    } finally {
        await prisma.$disconnect();
    }
}

export async function getDepartmentOptions(): Promise<string[]> {
    try {
        const departments = await prisma.department.findMany({
            select: { name: true },
            orderBy: { name: "asc" },
        })

        return departments.map((dept) => dept.name)
    } catch (error) {
        console.error("Error getting department options:", error)
        return []
    } finally {
        await prisma.$disconnect()
    }
}

export const getDepartmentsAction = async () => {
  try {
    const departments = await prisma.department.findMany()
    return { success: true, data: departments }
  } catch (error) {
    return { success: false, error: "Failed to fetch departments" }
  }
}