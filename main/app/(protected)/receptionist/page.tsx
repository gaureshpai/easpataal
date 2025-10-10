import type { Metadata } from "next";

import { Navbar } from "@/components/navbar";
import ReceptionistDashboard from "@/components/receptionist-dashboard-content";

export const metadata: Metadata = {
  title: "Receptionist Dashboard - EASPATAAL",
  description: "Receptionist dashboard for EASPATAAL",
};

export default function ReceptionistPage() {
  return (
    <>
      <Navbar />
      <ReceptionistDashboard />
    </>
    
  );
}
