import type { Metadata } from "next";
import CounterCRUDPage from "@/components/admin-counters-client";

export const metadata: Metadata = {
  title: "Counter Management - EASPATAAL",
  description: "Manage hospital counters.",
};

export default function CountersPage() {
  return <CounterCRUDPage />;
}