"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { Role } from "@prisma/client"

export interface CreateUserData {
    username: string
    name: string
    email?: string
    password: string
    role: Role
    department?: string
}

export interface UpdateUserData {
    name?: string
    email?: string
    password?: string
    department?: string
    role?: Role
    status?: string
}

export interface UserWithStats {
    id: string
    username: string
    name: string
    email?: string | null
    password?: string
    role: Role
    department?: string | null
    status: string
    createdAt: Date
    updatedAt: Date
}

export interface UserActionResponse<T> {
    success: boolean
    data?: T
    error?: string
}

export async function getAllUsersAction(): Promise<UserActionResponse<UserWithStats[]>> {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
        })

        await prisma.$disconnect()
        return { success: true, data: users as UserWithStats[] }
    } catch (error) {
        console.error("Error finding all users:", error)
        await prisma.$disconnect()
        return { success: false, error: "Failed to fetch users" }
    }
}

export async function getUserByIdAction(id: string): Promise<UserActionResponse<UserWithStats>> {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
        })

        await prisma.$disconnect()

        if (!user) {
            return { success: false, error: "User not found" }
        }

        return { success: true, data: user as UserWithStats }
    } catch (error) {
        console.error("Error finding user by ID:", error)
        await prisma.$disconnect()
        return { success: false, error: "Failed to fetch user" }
    }
}

export async function createUserAction(formData: FormData): Promise<UserActionResponse<UserWithStats>> {
    try {
        const username = formData.get("username") as string
        const name = formData.get("name") as string
        const email = formData.get("email") as string
        const password = formData.get("password") as string
        const role = formData.get("role") as Role
        const department = formData.get("department") as string

        if (!username || !name || !role) {
            return { success: false, error: "Username, name, and role are required" }
        }

        const existingUser = await prisma.user.findUnique({
            where: { username },
        })

        if (existingUser) {
            await prisma.$disconnect()
            return { success: false, error: "Username already exists" }
        }

        if (email) {
            const existingEmail = await prisma.user.findUnique({
                where: { email },
            })

            if (existingEmail) {
                await prisma.$disconnect()
                return { success: false, error: "Email already exists" }
            }
        }

        const userData: any = {
            username,
            name,
            email: email || undefined,
            role,
            department: department || undefined,
            status: "ACTIVE",
        }

        if (password) {
            try {
                userData.password = password
            } catch (error) {
                console.warn("Password field not available in schema yet")
            }
        }

        const user = await prisma.user.create({
            data: userData,
        })

        await prisma.$disconnect()
        revalidatePath("/admin/users")

        return { success: true, data: user as UserWithStats }
    } catch (error) {
        console.error("Error creating user:", error)
        await prisma.$disconnect()
        return { success: false, error: "Failed to create user" }
    }
}

export async function updateUserAction(id: string, formData: FormData): Promise<UserActionResponse<UserWithStats>> {
    try {
        const name = formData.get("name") as string
        const email = formData.get("email") as string
        const password = formData.get("password") as string
        const role = formData.get("role") as Role
        const department = formData.get("department") as string

        if (!name) {
            return { success: false, error: "Name is required" }
        }

        if (email) {
            const existingEmail = await prisma.user.findFirst({
                where: {
                    email,
                    NOT: { id },
                },
            })

            if (existingEmail) {
                await prisma.$disconnect()
                return { success: false, error: "Email already exists" }
            }
        }

        const updateData: any = {
            name,
            email: email || undefined,
            role,
            department: department || undefined,
            updatedAt: new Date(),
        }

        if (password && password.trim() !== "") {
            try {
                updateData.password = password
            } catch (error) {
                console.warn("Password field not available in schema yet")
            }
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
        })

        await prisma.$disconnect()
        revalidatePath("/admin/users")

        return { success: true, data: user as UserWithStats }
    } catch (error) {
        console.error("Error updating user:", error)
        await prisma.$disconnect()
        return { success: false, error: "Failed to update user" }
    }
}

export async function deleteUserAction(id: string): Promise<UserActionResponse<boolean>> {
    try {
        const userDependencies = await checkUserDependencies(id)

        if (userDependencies.hasAppointments || userDependencies.hasPrescriptions) {
            await prisma.user.update({
                where: { id },
                data: {
                    status: "INACTIVE",
                    updatedAt: new Date(),
                },
            })
        } else {
            await prisma.user.delete({
                where: { id },
            })
        }

        await prisma.$disconnect()
        revalidatePath("/admin/users")

        return { success: true, data: true }
    } catch (error) {
        console.error("Error deleting user:", error)
        await prisma.$disconnect()
        return { success: false, error: "Failed to delete user" }
    }
}

export async function toggleUserStatusAction(id: string): Promise<UserActionResponse<UserWithStats>> {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
        })

        if (!user) {
            await prisma.$disconnect()
            return { success: false, error: "User not found" }
        }

        const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                status: newStatus,
                updatedAt: new Date(),
            },
        })

        await prisma.$disconnect()
        revalidatePath("/admin/users")

        return { success: true, data: updatedUser as UserWithStats }
    } catch (error) {
        console.error("Error toggling user status:", error)
        await prisma.$disconnect()
        return { success: false, error: "Failed to update user status" }
    }
}

export async function getUserStatsAction() {
    try {
        const totalUsers = await prisma.user.count({
            where: { status: "ACTIVE" },
        })

        const usersByRole = await prisma.user.groupBy({
            by: ["role"],
            where: { status: "ACTIVE" },
            _count: {
                role: true,
            },
        })

        const usersByDepartment = await prisma.user.groupBy({
            by: ["department"],
            where: {
                status: "ACTIVE",
                department: { not: null },
            },
            _count: {
                department: true,
            },
        })

        await prisma.$disconnect()

        return {
            success: true,
            data: {
                total: totalUsers,
                byRole: usersByRole.reduce(
                    (acc, item) => {
                        acc[item.role] = item._count.role
                        return acc
                    },
                    {} as Record<Role, number>,
                ),
                byDepartment: usersByDepartment.reduce(
                    (acc, item) => {
                        if (item.department) {
                            acc[item.department] = item._count.department
                        }
                        return acc
                    },
                    {} as Record<string, number>,
                ),
            },
        }
    } catch (error) {
        console.error("Error getting user stats:", error)
        await prisma.$disconnect()
        return { success: false, error: "Failed to get user statistics" }
    }
}

async function checkUserDependencies(userId: string) {
    try {
        const [appointmentCount, prescriptionCount] = await Promise.all([
            prisma.appointment.count({
                where: { doctorId: userId },
            }),
            prisma.prescription.count({
                where: { doctorId: userId },
            }),
        ])

        return {
            hasAppointments: appointmentCount > 0,
            hasPrescriptions: prescriptionCount > 0,
        }
    } catch (error) {
        console.error("Error checking user dependencies:", error)
        return {
            hasAppointments: false,
            hasPrescriptions: false,
        }
    }
}

export async function getUserByUsernameAction(username: string): Promise<UserActionResponse<UserWithStats>> {
    try {
        const user = await prisma.user.findUnique({
            where: { username },
        })

        await prisma.$disconnect()

        if (!user) {
            return { success: false, error: "User not found" }
        }

        return { success: true, data: user as UserWithStats }
    } catch (error) {
        console.error("Error finding user by username:", error)
        await prisma.$disconnect()
        return { success: false, error: "Failed to fetch user" }
    }
}

export async function validateUserCredentialsAction(
    username: string,
    password: string,
): Promise<UserActionResponse<UserWithStats>> {
    try {
        const user = await prisma.user.findUnique({
            where: { username },
        })

        await prisma.$disconnect()

        if (!user) {
            return { success: false, error: "User not found" }
        }

        if (user.status !== "ACTIVE") {
            return { success: false, error: "Account is inactive" }
        }

        if ("password" in user && user.password) {
            if (user.password !== password) {
                return { success: false, error: "Invalid password" }
            }
        } else {
            console.warn("Password field not available, allowing login for development")
        }

        return { success: true, data: user as UserWithStats }
    } catch (error) {
        console.error("Error validating user credentials:", error)
        await prisma.$disconnect()
        return { success: false, error: "Failed to validate credentials" }
    }
}