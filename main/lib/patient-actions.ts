"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import sendSMS from "./twillio";

export const getAllPatientsAction = async () => {
  try {
    await prisma.$connect();
    console.log("Fetching all patients...");
    const patients = await prisma.patient.findMany();
    console.log("Patients fetched successfully:", patients);
    return { success: true, data: patients };
  } catch (error) {
    console.error("Error fetching patients:", error);
    return { success: false, error: "Failed to fetch patients" };
  }
};

export const createPatientAction = async (formData: FormData) => {
  try {
    await prisma.$connect();
    console.log("Creating patient with formData:", formData);
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const age = formData.get("age") as string;
    const gender = formData.get("gender") as string;
    const bloodType = formData.get("bloodType") as string;

    if (isNaN(parseInt(age))) {
      return { success: false, error: "Invalid age" };
    }

    const patient = await prisma.patient.create({
      data: {
        name,
        phone,
        age: parseInt(age),
        gender: gender as any,
        bloodType: bloodType as any,
      },
    });
    console.log("Patient created successfully:", patient);
    sendSMS(patient.phone!, `Hello ${patient.name}, your account has been created successfully in EASPATAL Portal`)
    revalidatePath("/receptionist");
    return { success: true, data: patient };
  } catch (error) {
    console.error("Error creating patient:", error);
    return { success: false, error: "Failed to create patient" };
  }
};

export const updatePatientAction = async (id: string, formData: FormData) => {
  try {
    await prisma.$connect();
    const name = formData.get("name") as string
    const phone = formData.get("phone") as string
    const age = formData.get("age") as string;
    const gender = formData.get("gender") as string;
    const bloodType = formData.get("bloodType") as string;

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        name,
        phone,
        age: parseInt(age),
        gender: gender as any,
        bloodType: bloodType as any,
      },
    });

    revalidatePath("/receptionist")
    return { success: true, data: patient }
  } catch (error) {
    return { success: false, error: "Failed to update patient" }
  }
}

export const searchPatientsAction = async (searchTerm: string) => {
  try {
    await prisma.$connect();
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        ],
      },
    })
    return { success: true, data: patients }
  } catch (error) {
    return { success: false, error: "Failed to search patients" }
  }
}
