import type { Metadata } from "next";
import UserManagementPage from "@/components/admin-users-client";

export const metadata: Metadata = {
  title: "User Management - EASPATAAL",
  description: "Manage hospital staff and user accounts.",
};

export default function UsersPage() {
  return <UserManagementPage />;
}