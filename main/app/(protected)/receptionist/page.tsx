import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import ReceptionistDashboard from "@/components/receptionist-dashboard-content";

export const metadata: Metadata = {
  title: "Receptionist Dashboard - EASPATAAL",
  description: "Receptionist dashboard for EASPATAAL",
};

export default function ReceptionistPage() {
  return (
    <AuthGuard allowedRoles={["RECEPTIONIST"]}>
      <Navbar />
      <ReceptionistDashboard />
    </AuthGuard>
  );
}
