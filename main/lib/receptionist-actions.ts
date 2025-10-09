"use server";

import { revalidatePath } from "next/cache";
import {
  updatePatient,
  updatePatientVitals,
  administerMedication,
  completeTask,
} from "./receptionist-service";

export async function updatePatientAction(
  patientId: string,
  patientData: {
    name: string;
    age: string;
    gender: string;
    condition: string;
    notes: string;
  }
) {
  try {
    const result = await updatePatient(patientId, {
      name: patientData.name,
      age: Number.parseInt(patientData.age),
      gender: patientData.gender,
      condition: patientData.condition,
      notes: patientData.notes,
    });

    revalidatePath("/receptionist");
    return result;
  } catch (error) {
    console.error("Error in updatePatientAction:", error);
    return { success: false, message: "Failed to update patient" };
  }
}

export async function updatePatientVitalsAction(
  patientId: string,
  vitalsData: {
    temp: string;
    bp: string;
    pulse: string;
    spo2: string;
    notes: string;
  }
) {
  try {
    const result = await updatePatientVitals(patientId, vitalsData);
    revalidatePath("/receptionist");
    return result;
  } catch (error) {
    console.error("Error in updatePatientVitalsAction:", error);
    return { success: false, message: "Failed to update vitals" };
  }
}

export async function administerMedicationAction(
  patientId: string,
  medicationName: string,
  receptionistId = "current-receptionist"
) {
  try {
    const result = await administerMedication(
      patientId,
      medicationName,
      receptionistId
    );
    revalidatePath("/receptionist");
    return result;
  } catch (error) {
    console.error("Error in administerMedicationAction:", error);
    return { success: false, message: "Failed to administer medication" };
  }
}

export async function completeTaskAction(
  taskId: string,
  receptionistId = "current-receptionist"
) {
  try {
    const result = await completeTask(taskId, receptionistId);
    revalidatePath("/receptionist");
    return result;
  } catch (error) {
    console.error("Error in completeTaskAction:", error);
    return { success: false, message: "Failed to complete task" };
  }
}

export async function refreshDashboardAction() {
  try {
    revalidatePath("/receptionist");
    return { success: true, message: "Dashboard refreshed successfully" };
  } catch (error) {
    console.error("Error in refreshDashboardAction:", error);
    return { success: false, message: "Failed to refresh dashboard" };
  }
}
