import type { Metadata } from "next";
import TokenDisplayPage from "@/components/display-token-client";

export const metadata: Metadata = {
  title: "Token Display - EASPATAAL",
  description: "Token display for EASPATAAL hospital management system.",
};

export default function Page() {
  return <TokenDisplayPage />;
}
