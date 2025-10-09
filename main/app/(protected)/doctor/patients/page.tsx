import type { Metadata } from "next";
import DoctorPatientsClient from "@/components/doctor-patients-client";

export const metadata: Metadata = {
  title: "Doctor's Patients - EASPATAAL",
  description: "Manage and view patient records.",
};

export default function DoctorPatientsPage() {
  return <DoctorPatientsClient />;
}