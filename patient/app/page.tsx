import type { Metadata } from "next";
import PatientTokenClient from "@/component/patient-token-client";

export const metadata: Metadata = {
  title: "Patient Token - EASPATAAL",
  description: "View your token information.",
};

export default function Page() {
  return <PatientTokenClient />;
}
