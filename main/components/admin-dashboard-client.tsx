'use client';
import { Monitor, Users, AlertTriangle, Clock } from "lucide-react";
// Removed useSession
// Removed Navbar
// Removed AuthGuard
// Removed getSystemAnalyticsAction
import { useToast } from "@/hooks/use-toast";
// Removed useEffect, useState, useTransition
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPanel({ analytics }: { analytics: any }) { // Accept analytics as prop
  const { toast } = useToast(); // Keep toast for potential future client-side actions

  // Removed useEffect, useState, useTransition, fetchInitialData

  // Removed loading state as data is now passed as prop
  // The loading state will be handled by the parent AdminPage component

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Patients</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.patients?.daily || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.patients?.change > 0 ? "+" : ""}
              {analytics?.patients?.change || 0} from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Wait Time</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.performance?.averageWaitTime || 0} min</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Busiest Counter</CardTitle>
            <Monitor className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.performance?.busiestCounter?.name || "N/A"}</div>
            <p className="text-xs text-muted-foreground">with {analytics?.performance?.busiestCounter?.count || 0} tokens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
            <Monitor className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.performance?.peakHour || "N/A"}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Counters</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Removed loading check here, as loading is handled by parent */}
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics?.counters?.map((counter: any) => (
                <tr key={counter.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{counter.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{counter.assignedUser?.name || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{counter.category?.name || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{counter.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}