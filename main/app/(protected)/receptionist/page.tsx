"use client"

import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import ReceptionistDashboard from "@/components/receptionist-dashboard-content";

export default function ReceptionistPage() {
  return (
    <AuthGuard allowedRoles={["RECEPTIONIST"]}>
      <Navbar />
      <ReceptionistDashboard />
    </AuthGuard>
  );
}
