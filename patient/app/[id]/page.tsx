import type { Metadata } from "next";
import UserVerification from "@/component/user-verification-client";

export const metadata: Metadata = {
  title: "User Verification - EASPATAAL",
  description: "Verify your phone number to continue.",
};

export default function Page() {
  return <UserVerification />;
}
