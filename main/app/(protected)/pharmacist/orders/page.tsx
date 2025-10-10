import type { Metadata } from "next";
import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { getPrescriptionsAction } from "@/lib/pharmacist-actions"
import OrdersClient from "@/components/orders-client"

export const metadata: Metadata = {
  title: "Prescription Orders - EASPATAAL",
  description: "Manage prescription orders.",
};

export default async function OrdersPage() {
  const prescriptions = await getPrescriptionsAction()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prescription Orders</h1>
            <p className="text-gray-500">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <Suspense fallback={<div>Loading prescriptions...</div>}>
          <OrdersClient prescriptions={prescriptions} />
        </Suspense>
      </main>
    </div>
  )
}
