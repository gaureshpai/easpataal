import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Provider from "@/components/SessionProvider";
import { getServerSession } from "next-auth";
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EASPATAAL",
  description: "Hospital queue management system - EASPATAAL",
  openGraph: {
    title: "EASPATAAL",
    description: "Hospital queue management system - EASPATAAL",
    url: "https://easpataal-employee.vercel.app",
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession();

  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider session={session}>
          {children}
          <Toaster />
        </Provider>
      </body>
    </html>
  )
}