import type { Metadata } from "next";
import AdminPanel from "@/components/admin-dashboard-client";
import { getSystemAnalyticsAction } from "@/lib/content-actions";

import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Admin Dashboard - EASPATAAL",
  description: "Admin dashboard for EASPATAAL",
};

export default async function AdminPage() {
  const { data: analytics, error } = await getSystemAnalyticsAction();

  if (error || !analytics) {
    return ;
  }

  return (
    <>
        <Navbar />
        <AdminPanel analytics={analytics} />
    </>
  );
}
