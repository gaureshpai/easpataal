import React from "react";
import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
