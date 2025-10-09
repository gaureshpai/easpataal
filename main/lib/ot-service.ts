"use server"

import prisma from "@/lib/prisma"

export interface OTTheater {
    id: string
    name: string
    status: "occupied" | "available" | "maintenance" | "cleaning" | "booked"
    currentSurgery?: {
        patient: string
        procedure: string
        surgeon: string
        startTime: string
        estimatedDuration: string
        elapsed: string
        progress: number
    }
    nextSurgery?: {
        patient: string
        procedure: string
        scheduledTime: string
    }
    lastCleaned?: string
    maintenanceType?: string
    estimatedCompletion?: string
}

export interface OTSchedule {
    id: string
    time: string
    duration: string
    patient: string
    procedure: string
    surgeon: string
    theater: string
    status: "scheduled" | "in-progress" | "completed"
}

export interface EmergencyCase {
    id: string
    patient: string
    condition: string
    priority: "critical" | "high" | "medium" | "low"
    waitTime: string
    estimatedDuration: string
}

export interface OTData {
    theaters: OTTheater[]
    todaySchedule: OTSchedule[]
    emergencyQueue: EmergencyCase[]
}

async function ensureDefaultTheaters() {
    const existingTheaters = await prisma.oTStatus.findMany()

    if (existingTheaters.length === 0) {
        const defaultTheaters = [
            {
                id: "OT-001",
                procedure: "Available",
                status: "Available",
                progress: 0,
                surgeon: "",
                patientName: "",
                startTime: new Date(),
                estimatedEnd: new Date(),
            },
            {
                id: "OT-002",
                procedure: "Available",
                status: "Available",
                progress: 0,
                surgeon: "",
                patientName: "",
                startTime: new Date(),
                estimatedEnd: new Date(),
            },
            {
                id: "OT-003",
                procedure: "Maintenance",
                status: "Maintenance",
                progress: 0,
                surgeon: "",
                patientName: "",
                startTime: new Date(),
                estimatedEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
            },
            {
                id: "OT-004",
                procedure: "Available",
                status: "Available",
                progress: 0,
                surgeon: "",
                patientName: "",
                startTime: new Date(),
                estimatedEnd: new Date(),
            },
        ]

        await prisma.oTStatus.createMany({
            data: defaultTheaters,
            skipDuplicates: true,
        })
    }
}

export async function getOTStatus(): Promise<OTData> {
    try {
        await ensureDefaultTheaters()

        const [otStatuses, patients, doctors, emergencyAlerts] = await Promise.all([
            prisma.oTStatus.findMany({
                orderBy: { createdAt: "desc" },
            }),

            prisma.patient.findMany({
                where: {
                    status: "Active",
                    condition: { not: null },
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            }),

            prisma.user.findMany({
                where: { role: "DOCTOR" },
                select: { id: true, name: true },
            }),

            prisma.emergencyAlert.findMany({
                where: { status: "active" },
                orderBy: { priority: "asc" },
            }),
        ])

        const theaters: OTTheater[] = otStatuses.map((ot: any) => {
            const now = new Date()
            const startTime = new Date(ot.startTime)
            const estimatedEnd = new Date(ot.estimatedEnd)

            let actualStatus: "occupied" | "available" | "maintenance" | "cleaning" | "booked" = "available"
            
            if (ot.status === "Maintenance") {
                actualStatus = now <= estimatedEnd ? "maintenance" : "available"
            }
            
            else if (ot.status === "Cleaning") {
                actualStatus = now <= estimatedEnd ? "cleaning" : "available"
            }
            
            else if (
                (ot.status === "In Progress" || ot.status === "Scheduled") &&
                now >= startTime &&
                now <= estimatedEnd &&
                ot.patientName &&
                ot.procedure !== "Available"
            ) {
                actualStatus = "occupied"
                
                if (ot.status === "Scheduled") {
                    updateTheaterStatusInDB(ot.id, "In Progress")
                }
            }
            
            else if (ot.status === "Scheduled" && now < startTime && ot.patientName && ot.procedure !== "Available") {
                actualStatus = "booked"
            }
            
            else if ((ot.status === "In Progress" || ot.status === "Scheduled") && now > estimatedEnd && ot.patientName) {
                actualStatus = "available"
                
                updateTheaterStatusInDB(ot.id, "Available")
            }
            
            else {
                actualStatus = "available"
            }

            const isInProgress = actualStatus === "occupied"
            const elapsed = isInProgress ? Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60)) : 0
            const totalDuration = Math.floor((estimatedEnd.getTime() - startTime.getTime()) / (1000 * 60))
            const progress =
                totalDuration > 0 && isInProgress ? Math.min(Math.floor((elapsed / totalDuration) * 100), 100) : 0

            return {
                id: ot.id,
                name: `Operating Theater ${ot.id.replace("OT-", "")}`,
                status: actualStatus,
                currentSurgery:
                    isInProgress && ot.patientName
                        ? {
                            patient: ot.patientName,
                            procedure: ot.procedure,
                            surgeon: ot.surgeon,
                            startTime: startTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
                            estimatedDuration: `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`,
                            elapsed: `${Math.floor(elapsed / 60)}h ${elapsed % 60}m`,
                            progress: progress,
                        }
                        : undefined,
                nextSurgery:
                    actualStatus === "booked" && ot.patientName
                        ? {
                            patient: ot.patientName,
                            procedure: ot.procedure,
                            scheduledTime: startTime.toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "short",
                            }),
                        }
                        : undefined,
                lastCleaned: actualStatus === "available" ? "Recently cleaned" : undefined,
                maintenanceType: actualStatus === "maintenance" ? "Equipment Check" : undefined,
                estimatedCompletion:
                    actualStatus === "maintenance" || actualStatus === "cleaning"
                        ? estimatedEnd.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                        : undefined,
            }
        })

        const todaySchedule: OTSchedule[] = otStatuses
            .filter((ot: any) => ot.patientName && ot.procedure !== "Available")
            .map((ot: any) => {
                const now = new Date()
                const startTime = new Date(ot.startTime)
                const estimatedEnd = new Date(ot.estimatedEnd)

                let status: "scheduled" | "in-progress" | "completed" = "scheduled"
                if (now >= startTime && now <= estimatedEnd) {
                    status = "in-progress"
                } else if (now > estimatedEnd) {
                    status = "completed"
                }

                return {
                    id: ot.id,
                    time: startTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
                    duration: `${Math.floor((estimatedEnd.getTime() - startTime.getTime()) / (1000 * 60 * 60))}h`,
                    patient: ot.patientName,
                    procedure: ot.procedure,
                    surgeon: ot.surgeon,
                    theater: ot.id,
                    status: status,
                }
            })

        const emergencyQueue: EmergencyCase[] = []

        emergencyAlerts.forEach((alert: any) => {
            emergencyQueue.push({
                id: alert.id,
                patient: `Emergency Case ${alert.id.slice(-4)}`,
                condition: alert.message,
                priority: alert.priority === 1 ? "critical" : alert.priority === 2 ? "high" : "medium",
                waitTime: `${Math.floor((new Date().getTime() - alert.createdAt.getTime()) / (1000 * 60))} mins`,
                estimatedDuration: "1-2 hours",
            })
        })

        patients
            .filter(
                (p: any) =>
                    p.condition?.toLowerCase().includes("emergency") ||
                    p.condition?.toLowerCase().includes("critical") ||
                    p.condition?.toLowerCase().includes("urgent"),
            )
            .slice(0, 3)
            .forEach((patient: any) => {
                emergencyQueue.push({
                    id: patient.id,
                    patient: patient.name,
                    condition: patient.condition || "Emergency condition",
                    priority: patient.condition?.toLowerCase().includes("critical") ? "critical" : "high",
                    waitTime: `${Math.floor((new Date().getTime() - patient.createdAt.getTime()) / (1000 * 60 * 60))} hours`,
                    estimatedDuration: "1-3 hours",
                })
            })

        return {
            theaters,
            todaySchedule,
            emergencyQueue: emergencyQueue.slice(0, 5),
        }
    } catch (error) {
        console.error("Error fetching OT status:", error)

        return {
            theaters: [
                { id: "OT-001", name: "Operating Theater 1", status: "available", lastCleaned: "Recently cleaned" },
                { id: "OT-002", name: "Operating Theater 2", status: "available", lastCleaned: "Recently cleaned" },
                {
                    id: "OT-003",
                    name: "Operating Theater 3",
                    status: "maintenance",
                    maintenanceType: "Equipment Check",
                    estimatedCompletion: "3:00 PM",
                },
                { id: "OT-004", name: "Operating Theater 4", status: "available", lastCleaned: "Recently cleaned" },
            ],
            todaySchedule: [],
            emergencyQueue: [],
        }
    }
}

export async function checkSchedulingConflict(
    theaterId: string,
    scheduledTime: Date,
    estimatedDuration: string,
): Promise<boolean> {
    try {
        const durationHours = Number.parseFloat(estimatedDuration.split(" ")[0]) || 2
        const proposedEndTime = new Date(scheduledTime.getTime() + durationHours * 60 * 60 * 1000)

        const existingBooking = await prisma.oTStatus.findFirst({
            where: {
                id: theaterId,
                patientName: { not: "null" },
                OR: [
                    {
                        AND: [{ startTime: { lte: scheduledTime } }, { estimatedEnd: { gte: scheduledTime } }],
                    },
                    {
                        AND: [{ startTime: { lte: proposedEndTime } }, { estimatedEnd: { gte: proposedEndTime } }],
                    },
                    {
                        AND: [{ startTime: { gte: scheduledTime } }, { estimatedEnd: { lte: proposedEndTime } }],
                    },
                ],
            },
        })

        return !!existingBooking
    } catch (error) {
        console.error("Error checking scheduling conflict:", error)
        return false
    }
}

export async function getAvailableTheaters(): Promise<OTTheater[]> {
    try {
        const otData = await getOTStatus()
        return otData.theaters.filter((theater) => theater.status === "available")
    } catch (error) {
        console.error("Error fetching available theaters:", error)
        return []
    }
}

export async function getOTStatistics() {
    try {
        const otData = await getOTStatus()

        const [totalPatients, totalDoctors, activeEmergencies] = await Promise.all([
            prisma.patient.count({ where: { status: "Active" } }),
            prisma.user.count({ where: { role: "DOCTOR" } }),
            prisma.emergencyAlert.count({ where: { status: "active" } }),
        ])

        return {
            totalTheaters: otData.theaters.length || 4,
            occupiedTheaters: otData.theaters.filter((t) => t.status === "occupied").length,
            availableTheaters: otData.theaters.filter((t) => t.status === "available").length,
            maintenanceTheaters: otData.theaters.filter((t) => t.status === "maintenance" || t.status === "cleaning").length,
            scheduledSurgeries: otData.todaySchedule.length,
            emergencyCases: otData.emergencyQueue.length,
            avgWaitTime:
                otData.emergencyQueue.length > 0
                    ? `${Math.floor(
                        otData.emergencyQueue.reduce((acc, case_) => acc + Number.parseInt(case_.waitTime.split(" ")[0]), 0) /
                        otData.emergencyQueue.length,
                    )} mins`
                    : "0 mins",
            totalPatients,
            totalDoctors,
            activeEmergencies,
        }
    } catch (error) {
        console.error("Error fetching OT statistics:", error)
        throw new Error("Failed to fetch OT statistics")
    }
}

export async function scheduleSurgery(surgeryData: {
    patientId: string
    procedure: string
    surgeonId: string
    surgeonIds?: string[]
    theaterId: string
    scheduledTime: Date
    estimatedDuration: string
    priority: string
    notes?: string
}) {
    try {
        const [patient, primarySurgeon] = await Promise.all([
            prisma.patient.findUnique({ where: { id: surgeryData.patientId } }),
            prisma.user.findUnique({
                where: { id: surgeryData.surgeonId },
                select: { id: true, name: true, role: true },
            }),
        ])

        if (!patient) {
            throw new Error("Patient not found")
        }

        if (!primarySurgeon) {
            const fallbackSurgeon = await prisma.user.findFirst({
                where: { role: "DOCTOR" },
                select: { id: true, name: true, role: true },
            })

            if (!fallbackSurgeon) {
                throw new Error("No surgeons available")
            }
            
            const durationHours = Number.parseFloat(surgeryData.estimatedDuration.split(" ")[0]) || 2
            const estimatedEnd = new Date(surgeryData.scheduledTime.getTime() + durationHours * 60 * 60 * 1000)
            
            let surgeonNames = fallbackSurgeon.name || "Available Doctor"
            if (surgeryData.surgeonIds && surgeryData.surgeonIds.length > 1) {
                const allSurgeons = await prisma.user.findMany({
                    where: { id: { in: surgeryData.surgeonIds } },
                    select: { name: true },
                })
                surgeonNames = allSurgeons.map((s) => s.name).join(", ")
            }

            await prisma.oTStatus.upsert({
                where: { id: surgeryData.theaterId },
                update: {
                    procedure: surgeryData.procedure,
                    status: "Scheduled",
                    progress: 0,
                    surgeon: surgeonNames,
                    patientName: patient.name,
                    startTime: surgeryData.scheduledTime,
                    estimatedEnd: estimatedEnd,
                    updatedAt: new Date(),
                },
                create: {
                    id: surgeryData.theaterId,
                    procedure: surgeryData.procedure,
                    status: "Scheduled",
                    progress: 0,
                    surgeon: surgeonNames,
                    patientName: patient.name,
                    startTime: surgeryData.scheduledTime,
                    estimatedEnd: estimatedEnd,
                },
            })

            await prisma.appointment.create({
                data: {
                    patientId: surgeryData.patientId,
                    doctorId: fallbackSurgeon.id,
                    date: surgeryData.scheduledTime,
                    time: surgeryData.scheduledTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
                    type: "EMERGENCY",
                    status: "Scheduled",
                    notes: `Surgery: ${surgeryData.procedure} - Priority: ${surgeryData.priority}${surgeryData.notes ? ` - ${surgeryData.notes}` : ""}`,
                },
            })

            return { success: true, id: surgeryData.theaterId }
        }

        const durationHours = Number.parseFloat(surgeryData.estimatedDuration.split(" ")[0]) || 2
        const estimatedEnd = new Date(surgeryData.scheduledTime.getTime() + durationHours * 60 * 60 * 1000)
        
        let surgeonNames = primarySurgeon.name || "Selected Doctor"
        if (surgeryData.surgeonIds && surgeryData.surgeonIds.length > 1) {
            const allSurgeons = await prisma.user.findMany({
                where: { id: { in: surgeryData.surgeonIds } },
                select: { name: true },
            })
            surgeonNames = allSurgeons.map((s) => s.name).join(", ")
        }

        await prisma.oTStatus.upsert({
            where: { id: surgeryData.theaterId },
            update: {
                procedure: surgeryData.procedure,
                status: "Scheduled",
                progress: 0,
                surgeon: surgeonNames,
                patientName: patient.name,
                startTime: surgeryData.scheduledTime,
                estimatedEnd: estimatedEnd,
                updatedAt: new Date(),
            },
            create: {
                id: surgeryData.theaterId,
                procedure: surgeryData.procedure,
                status: "Scheduled",
                progress: 0,
                surgeon: surgeonNames,
                patientName: patient.name,
                startTime: surgeryData.scheduledTime,
                estimatedEnd: estimatedEnd,
            },
        })

        await prisma.appointment.create({
            data: {
                patientId: surgeryData.patientId,
                doctorId: surgeryData.surgeonId,
                date: surgeryData.scheduledTime,
                time: surgeryData.scheduledTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
                type: "EMERGENCY",
                status: "Scheduled",
                notes: `Surgery: ${surgeryData.procedure} - Priority: ${surgeryData.priority}${surgeryData.notes ? ` - ${surgeryData.notes}` : ""}`,
            },
        })

        return { success: true, id: surgeryData.theaterId }
    } catch (error) {
        console.error("Error scheduling surgery:", error)
        throw new Error("Failed to schedule surgery")
    }
}

export async function updateTheaterStatus(theaterId: string, status: string) {
    try {
        await prisma.oTStatus.update({
            where: { id: theaterId },
            data: {
                status: status,
                updatedAt: new Date(),
            },
        })

        return { success: true }
    } catch (error) {
        console.error("Error updating theater status:", error)
        throw new Error("Failed to update theater status")
    }
}

export async function addEmergencyCase(emergencyData: {
    patientName: string
    condition: string
    priority: string
    estimatedDuration: string
}) {
    try {
        const priorityNum = emergencyData.priority === "critical" ? 1 : emergencyData.priority === "high" ? 2 : 3

        const alert = await prisma.emergencyAlert.create({
            data: {
                codeType: "MEDICAL_EMERGENCY",
                message: `${emergencyData.condition} - Patient: ${emergencyData.patientName}`,
                location: "Emergency Department",
                priority: priorityNum,
                status: "active",
                broadcastTo: ["DOCTOR", "NURSE"],
            },
        })

        return { success: true, id: alert.id }
    } catch (error) {
        console.error("Error adding emergency case:", error)
        throw new Error("Failed to add emergency case")
    }
}

export async function createTheater(theaterData: {
    id: string
    name: string
    location?: string
    equipment?: string[]
}) {
    try {
        await prisma.oTStatus.create({
            data: {
                id: theaterData.id,
                procedure: "Available",
                status: "Available",
                progress: 0,
                surgeon: "",
                patientName: "",
                startTime: new Date(),
                estimatedEnd: new Date(),
            },
        })

        return { success: true, id: theaterData.id }
    } catch (error) {
        console.error("Error creating theater:", error)
        throw new Error("Failed to create theater")
    }
}

export async function updateTheater(
    theaterId: string,
    theaterData: {
        name?: string
        status?: string
        location?: string
        equipment?: string[]
    },
) {
    try {
        const updateData: any = {}

        if (theaterData.status) {
            updateData.status = theaterData.status
            if (theaterData.status === "Maintenance") {
                updateData.estimatedEnd = new Date(Date.now() + 2 * 60 * 60 * 1000) 
            }
        }

        await prisma.oTStatus.update({
            where: { id: theaterId },
            data: {
                ...updateData,
                updatedAt: new Date(),
            },
        })

        return { success: true }
    } catch (error) {
        console.error("Error updating theater:", error)
        throw new Error("Failed to update theater")
    }
}

export async function deleteTheater(theaterId: string) {
    try {
        await prisma.oTStatus.delete({
            where: { id: theaterId },
        })

        return { success: true }
    } catch (error) {
        console.error("Error deleting theater:", error)
        throw new Error("Failed to delete theater")
    }
}

async function updateTheaterStatusInDB(theaterId: string, status: string) {
    try {
        await prisma.oTStatus.update({
            where: { id: theaterId },
            data: {
                status: status,
                updatedAt: new Date(),
                
                ...(status === "Available" && {
                    patientName: "",
                    procedure: "Available",
                    surgeon: "",
                    progress: 0,
                }),
            },
        })
    } catch (error) {
        console.error("Error updating theater status in DB:", error)
    }
}