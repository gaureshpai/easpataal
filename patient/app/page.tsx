import type { Metadata } from "next";
import { connection } from 'next/server'
import PatientTokenClient from "@/component/patient-token-client";

export const metadata: Metadata = {
  title: "Patient Token - EASPATAAL",
  description: "View your token information.",
};

export default async function Page() {
  await connection()
  return <PatientTokenClient />;
}