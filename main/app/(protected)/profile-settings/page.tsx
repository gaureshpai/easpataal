import type { Metadata } from "next";
import ProfileSettings from "@/components/profile-settings-client";

export const metadata: Metadata = {
  title: "Profile Settings - EASPATAAL",
  description: "View your account information.",
};

export default function ProfileSettingsPage() {
  return <ProfileSettings />;
}
