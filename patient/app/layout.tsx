import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/component/Navbar";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EASPATAAL - Patient",
  description: "Patient portal for EASPATAAL",
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
