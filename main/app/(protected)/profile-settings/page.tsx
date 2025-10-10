import type { Metadata } from "next";
import ProfileSettings from "@/components/profile-settings-client";
import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Profile Settings - EASPATAAL",
  description: "View your account information.",
};

export default function ProfileSettingsPage() {
  return (
    <>
      <Navbar />
      <AuthGuard
        allowedRoles={["ADMIN", "DOCTOR", "RECEPTIONIST", "PHARMACIST"]}
        className="container mx-auto p-6 space-y-6"
      >
        <ProfileSettings />
      </AuthGuard>
    </>
  );
}