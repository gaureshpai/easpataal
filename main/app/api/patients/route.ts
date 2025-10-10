import { NextResponse } from "next/server"
import prisma  from "@/lib/prisma"

export async function GET() {
    try {
        await prisma.$connect();
        const patients = await prisma.patient.findMany({
            where: { status: "ACTIVE" },
            select: {
                id: true,
                name: true,
                condition: true,
                age: true,
                gender: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        })

        return NextResponse.json(patients)
    } catch (error) {
        console.error("Error fetching patients:", error)
        return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 })
    }
}
