"use server"
import { Feedback } from "@prisma/client";

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { Role, User } from "@prisma/client"
import bcrypt from "bcrypt"

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

export async function getAllUsersAction(): Promise<UserActionResponse<User[]>> {
    try {
        await prisma.$connect()
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
        })

        
        return { success: true, data: users as User[] }
    } catch (error) {
        console.error("Error finding all users:", error)
        
        return { success: false, error: "Failed to fetch users" }
    }
}

export async function getUserByIdAction(id: string): Promise<UserActionResponse<User>> {
    try {
        await prisma.$connect();
        const user = await prisma.user.findUnique({
            where: { id },
        })

        

        if (!user) {
            return { success: false, error: "User not found" }
        }

        return { success: true, data: user as User }
    } catch (error) {
        console.error("Error finding user by ID:", error)
        
        return { success: false, error: "Failed to fetch user" }
    }
}

export async function createUserAction(formData: FormData): Promise<UserActionResponse<User>> {
    try {
        await prisma.$connect();
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
            
            return { success: false, error: "Username already exists" }
        }

        if (email) {
            const existingEmail = await prisma.user.findUnique({
                where: { email },
            })

            if (existingEmail) {
                
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
                userData.password = bcrypt.hashSync(password, 10)
            } catch (error) {
                console.warn(error)
            }
        }

        const user = await prisma.user.create({
            data: userData,
        })

        
        revalidatePath("/admin/users")

        return { success: true, data: user as User }
    } catch (error) {
        console.error("Error creating user:", error)
        
        return { success: false, error: "Failed to create user" }
    }
}

export async function updateUserAction(id: string, formData: FormData): Promise<UserActionResponse<User>> {
    try {
        await prisma.$connect();
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
                updateData.password = bcrypt.hashSync(password, 10)
            } catch (error) {
                console.warn("Password field not available in schema yet")
            }
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
        })

        
        revalidatePath("/admin/users")

        return { success: true, data: user as User }
    } catch (error) {
        console.error("Error updating user:", error)
        
        return { success: false, error: "Failed to update user" }
    }
}

export async function deleteUserAction(id: string): Promise<UserActionResponse<boolean>> {
    try {
        await prisma.$connect();
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

        
        revalidatePath("/admin/users")

        return { success: true, data: true }
    } catch (error) {
        console.error("Error deleting user:", error)
        
        return { success: false, error: "Failed to delete user" }
    }
}

export async function toggleUserStatusAction(id: string): Promise<UserActionResponse<User>> {
    try {
        await prisma.$connect();
        const user = await prisma.user.findUnique({
            where: { id },
        })

        if (!user) {
            
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

        
        revalidatePath("/admin/users")

        return { success: true, data: updatedUser as User }
    } catch (error) {
        console.error("Error toggling user status:", error)
        
        return { success: false, error: "Failed to update user status" }
    }
}

export async function getUserStatsAction() {
    try {
        await prisma.$connect();
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
            },
            _count: {
                department: true,
            },
        })

        

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
        
        return { success: false, error: "Failed to get user statistics" }
    }
}

async function checkUserDependencies(userId: string) {
    try {
        await prisma.$connect();
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

export async function getUserByUsernameAction(username: string): Promise<UserActionResponse<User>> {
    try {
        await prisma.$connect();
        const user = await prisma.user.findUnique({
            where: { username },
        })

        

        if (!user) {
            return { success: false, error: "User not found" }
        }

        return { success: true, data: user as User }
    } catch (error) {
        console.error("Error finding user by username:", error)
        
        return { success: false, error: "Failed to fetch user" }
    }
}

export async function validateUserCredentialsAction(
    username: string,
    password: string,
): Promise<UserActionResponse<User>> {
    try {
        await prisma.$connect();
        const user = await prisma.user.findUnique({
            where: { username },
        })

        

        if (!user) {
            return { success: false, error: "Invalid credentials" }
        }

        if (user.status !== "ACTIVE") {
            return { success: false, error: "Account is inactive" }
        }

        if (user.password) {
            const passwordMatch = await bcrypt.compare(password, user.password)
            if (!passwordMatch) {
                return { success: false, error: "Invalid credentials" }
            }
        } else {
            // This case should ideally not happen if all users have passwords
            return { success: false, error: "Invalid credentials" }
        }

        return { success: true, data: user as User }
    } catch (error) {
        console.error("Error validating user credentials:", error)
        
        return { success: false, error: "Failed to validate credentials" }
    }
}

export async function getDoctorsAction(): Promise<UserActionResponse<User[]>> {
    try {
        await prisma.$connect();
        const doctors = await prisma.user.findMany({
            where: { role: "DOCTOR" },
        });

        ;
        return { success: true, data: doctors as User[] };
    } catch (error) {
        console.error("Error finding doctors:", error);
        ;
        return { success: false, error: "Failed to fetch doctors" };
    }
}

export async function getFeedbackAnalytics(): Promise<UserActionResponse<{
  anonymousFeedbacks: Feedback[];
  tokenFeedbacks: any[]; // Define a proper type for this
  anonymousFeedbackStats: {
    avgRating: number | null;
    totalFeedbacks: number;
  };
  bestDoctor: {
    name: string;
    avgRating: number;
  } | null;
}>> {
  try {
    await prisma.$connect();
    // 1. Anonymous feedback
    const anonymousFeedbacks = await prisma.feedback.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    const anonymousFeedbackAggregation = await prisma.feedback.aggregate({
      _avg: {
        rating: true,
      },
      _count: {
        _all: true,
      },
    });

    // 2. Token feedback
    const tokenFeedbacks = await prisma.tokenQueue.findMany({
        where: {
            OR: [
                { feedback: { not: null } },
                { rating: { not: null } }
            ]
        },
        include: {
            patient: true,
            counter: {
                include: {
                    assignedUser: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    // 3. Best doctor
    const bestDoctorAgg = await prisma.tokenQueue.groupBy({
      by: ['counterId'],
      where: {
        rating: {
          not: null,
        },
        counterId: {
            not: null
        }
      },
      _avg: {
        rating: true,
      },
      orderBy: {
        _avg: {
          rating: 'desc',
        },
      },
      take: 1,
    });

    let bestDoctorData = null;
    if (bestDoctorAgg.length > 0) {
      const bestCounterId = bestDoctorAgg[0].counterId;
      if (bestCounterId) {
        const counter = await prisma.counter.findUnique({
          where: { id: bestCounterId },
          include: { assignedUser: true },
        });
        if (counter && counter.assignedUser) {
          bestDoctorData = {
            name: counter.assignedUser.name,
            avgRating: bestDoctorAgg[0]._avg.rating!,
          };
        }
      }
    }

    ;
    return {
      success: true,
      data: {
        anonymousFeedbacks,
        tokenFeedbacks,
        anonymousFeedbackStats: {
          avgRating: anonymousFeedbackAggregation._avg.rating,
          totalFeedbacks: anonymousFeedbackAggregation._count._all,
        },
        bestDoctor: bestDoctorData,
      },
    };
  } catch (error) {
    console.error("Error getting feedback analytics:", error);
    ;
    return { success: false, error: "Failed to fetch feedback analytics" };
  }
}