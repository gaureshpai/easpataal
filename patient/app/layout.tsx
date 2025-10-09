import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/component/Navbar";

export const metadata = {
  title: "patient",
  description: "This is the patient project",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
