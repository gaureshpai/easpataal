import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/component/Navbar";
import { Toaster } from "@/component/ui/toaster";

export const metadata: Metadata = {
  title: "EASPATAAL - Patient",
  metadataBase: new URL("https://easpataal.vercel.app"),
  description: "Patient portal for EASPATAAL",
  manifest: "/manifest.json", // Add this line for PWA manifest
  openGraph: {
    title: "EASPATAAL - Patient",
    description: "Patient portal for EASPATAAL",
    url: "https://easpataal.vercel.app",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "EASPATAAL Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
}

export const viewport = {
  themeColor: "#ffffff",
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
        <Toaster />
      </body>
    </html>
  );
}
