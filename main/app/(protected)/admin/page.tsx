import type { Metadata } from "next";
import AdminPanel from "@/components/admin-dashboard-client";
import { getSystemAnalyticsAction } from "@/lib/content-actions";
import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Admin Dashboard - EASPATAAL",
  description: "Admin dashboard for EASPATAAL",
};

export default async function AdminPage() {
  const { data: analytics, error } = await getSystemAnalyticsAction();

  if (error || !analytics) {
    return (
      <AuthGuard allowedRoles={["ADMIN"]}>
        <Navbar />
        <div className="container mx-auto p-6 text-red-500">
          Error loading admin dashboard: {error || "No data found."}
        </div>
      </AuthGuard>
    );
  }

  return (
    <>
      <Navbar />
      <AuthGuard allowedRoles={["ADMIN"]} className="container mx-auto p-2 md:p-6 space-y-6">
        <AdminPanel analytics={analytics} />
      </AuthGuard>
    </>
  );
}
