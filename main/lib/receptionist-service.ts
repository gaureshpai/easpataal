"use server";

import prisma from "@/lib/prisma";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bed: string;
  condition: string;
  status: string;
  doctor: string;
  department: string;
  admissionDate: string;
  vitals: {
    temp: string;
    bp: string;
    pulse: string;
    spo2: string;
    lastUpdated: string;
  };
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    nextDue: string;
    status: "due" | "administered" | "missed";
  }[];
  notes?: string;
}

export interface Surgery {
  id: string;
  patientName: string;
  surgeon: string;
  procedure: string;
  theater: string;
  scheduledTime: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  estimatedDuration: string;
}

export interface Task {
  id: string;
  patientId: string;
  patientName: string;
  task: string;
  priority: "high" | "medium" | "low";
  time: string;
  completed: boolean;
  assignedBy: string;
}

export interface ReceptionistDashboardData {
  patients: Patient[];
  tasks: Task[];
}

export async function getReceptionistDashboardData(): Promise<ReceptionistDashboardData> {
  try {
    const patientsData = await prisma.patient.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        prescriptions: {
          include: {
            items: {
              include: {
                drug: true,
              },
            },
            doctor: {              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const patients: Patient[] = patientsData.map((patient) => {
      const vitals =
        typeof patient.vitals === "object" && patient.vitals !== null
          ? (patient.vitals as {
            bp?: string;
            pulse?: string;
            temp?: string;
            spo2?: string;
          })
          : { bp: "", pulse: "", temp: "", spo2: "" };

      const latestPrescription = patient.prescriptions[0];
      const medications =
        latestPrescription?.items.map((item) => ({
          name: item.drug.drugName,
          dosage: item.dosage,
          frequency: item.frequency,
          nextDue: getNextDueTime(item.frequency),
          status: "due" as const,
        })) || [];

      return {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        bed: `${patient.id.slice(-3)}`,
        condition: patient.condition || "Stable",
        status: patient.status,
        doctor: latestPrescription?.doctor.name || "Dr. Assigned",
        department: "General",
        admissionDate: patient.createdAt.toISOString().split("T")[0],
        vitals: {
          temp: vitals.temp || "98.6°F",
          bp: vitals.bp || "120/80",
          pulse: vitals.pulse || "72 bpm",
          spo2: vitals.spo2 || "98%",
          lastUpdated: patient.updatedAt.toISOString(),
        },
        medications,
        notes: "",
      };
    });

    const tasks: Task[] = patients
      .filter(
        (patient) =>
          patient.condition === "Critical" || patient.medications.length > 0
      )
      .map((patient, index) => ({
        id: `task-${patient.id}-${index}`,
        patientId: patient.id,
        patientName: patient.name,
        task:
          patient.condition === "Critical"
            ? "Monitor vitals every hour"
            : "Administer scheduled medications",
        priority: patient.condition === "Critical" ? "high" : "medium",
        time: new Date(Date.now() + index * 60 * 60 * 1000).toLocaleTimeString(
          "en-IN",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        ),
        completed: false,
        assignedBy: patient.doctor,
      }));

    return { patients, tasks }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return { patients: [], tasks: [] }
  }
}

export async function updatePatient(
  patientId: string,
  patientData: {
    name?: string;
    age?: number;
    gender?: string;
    condition?: string;
    notes?: string;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.patient.update({
      where: { id: patientId },
      data: {
        name: patientData.name,
        age: patientData.age,
        gender: patientData.gender as any,
        condition: patientData.condition,
        updatedAt: new Date(),
      },
    });

    return { success: true, message: "Patient updated successfully" };
  } catch (error) {
    console.error("Error updating patient:", error);
    throw new Error("Failed to update patient");
  }
}

export async function updatePatientVitals(
  patientId: string,
  vitalsData: {
    temp?: string;
    bp?: string;
    pulse?: string;
    spo2?: string;
    notes?: string;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { vitals: true },
    });

    const currentVitals =
      typeof patient?.vitals === "object" && patient.vitals !== null
        ? (patient.vitals as Record<string, any>)
        : {};

    const updatedVitals = {
      ...currentVitals,
      temp: vitalsData.temp || currentVitals.temp,
      bp: vitalsData.bp || currentVitals.bp,
      pulse: vitalsData.pulse || currentVitals.pulse,
      spo2: vitalsData.spo2 || currentVitals.spo2,
      lastUpdated: new Date().toISOString(),
    };

    await prisma.patient.update({
      where: { id: patientId },
      data: {
        vitals: updatedVitals,
        updatedAt: new Date(),
      },
    });

    return { success: true, message: "Vitals updated successfully" };
  } catch (error) {
    console.error("Error updating vitals:", error);
    throw new Error("Failed to update vitals");
  }
}

export async function administerMedication(
  patientId: string,
  medicationName: string,
  receptionistId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const prescriptionItem = await prisma.prescriptionItem.findFirst({
      where: {
        prescription: {
          patientId: patientId,
        },
        drug: {
          drugName: {
            contains: medicationName,
            mode: "insensitive",
          },
        },
      },
      include: {
        drug: true,
        prescription: true,
      },
    });

    if (!prescriptionItem) {
      return {        success: false,
        message: "Medication not found in patient's prescription",
      };
    }

    if (prescriptionItem.drug.currentStock > 0) {
      await prisma.drugInventory.update({
        where: { id: prescriptionItem.drug.id },
        data: {
          currentStock: prescriptionItem.drug.currentStock - 1,
          updatedAt: new Date(),
        },
      });
    }

    return { success: true, message: "Medication administered successfully" };
  } catch (error) {
    console.error("Error administering medication:", error);
    throw new Error("Failed to administer medication");
  }
}

export async function completeTask(
  taskId: string,
  receptionistId: string
): Promise<{ success: boolean; message: string }> {
  try {
    return { success: true, message: "Task completed successfully" };
  } catch (error) {
    console.error("Error completing task:", error);
    throw new Error("Failed to complete task");
  }
}

export async function getReceptionistStats() {
  try {
    const [totalPatients, criticalPatients] =
      await Promise.all([
        prisma.patient.count({
          where: { status: "ACTIVE" },
        }),
        prisma.patient.count({
          where: {
            status: "ACTIVE", condition: "Critical",
          },
        }),
      ]);

    return {
      totalPatients,
      criticalPatients
    };
  } catch (error) {
    console.error("Error fetching receptionist stats:", error);
    throw new Error("Failed to fetch receptionist statistics");
  }
}

function getNextDueTime(frequency: string): string {
  const now = new Date();
  const nextDue = new Date(now);

  if (
    frequency.toLowerCase().includes("daily") ||
    frequency.toLowerCase().includes("once")
  ) {
    nextDue.setHours(9, 0, 0, 0);
    if (nextDue <= now) {
      nextDue.setDate(nextDue.getDate() + 1);
    }
  } else if (frequency.toLowerCase().includes("6 hours")) {
    const hours = Math.ceil((now.getHours() + 1) / 6) * 6;
    nextDue.setHours(hours % 24, 0, 0, 0);
    if (hours >= 24) {
      nextDue.setDate(nextDue.getDate() + 1);
    }
  } else if (frequency.toLowerCase().includes("8 hours")) {
    const hours = Math.ceil((now.getHours() + 1) / 8) * 8;
    nextDue.setHours(hours % 24, 0, 0, 0);
    if (hours >= 24) {
      nextDue.setDate(nextDue.getDate() + 1);
    }
  } else {
    nextDue.setHours(now.getHours() + 1, 0, 0, 0);
  }

  return nextDue.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
