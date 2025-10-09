import type { Metadata } from "next";
import AdminPanel from "@/components/admin-dashboard-client";

export const metadata: Metadata = {
  title: "Admin Dashboard - EASPATAAL",
  description: "Admin dashboard for EASPATAAL",
};

export default function AdminPage() {
  return <AdminPanel />;
}