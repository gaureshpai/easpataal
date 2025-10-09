import type { Metadata } from "next";
import LoginPage from "@/components/login-page-client";

export const metadata: Metadata = {
  title: "Login - EASPATAAL",
  description: "Login to EASPATAAL hospital management system.",
};

export default function Page() {
  return <LoginPage />;
}