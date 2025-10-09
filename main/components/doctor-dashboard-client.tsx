import type { Metadata } from "next";
import DoctorDashboard from "@/components/doctor-dashboard-client";

export const metadata: Metadata = {
  title: "Doctor Dashboard - EASPATAAL",
  description: "Doctor dashboard for EASPATAAL",
};

export default function DoctorPage() {
  return <DoctorDashboard />;
}
