'use client';
import { Monitor, Users, AlertTriangle, Clock } from "lucide-react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { getSystemAnalyticsAction } from "@/lib/content-actions";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPanel() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      startTransition(async () => {
        const analyticsResult = await getSystemAnalyticsAction();
        if (analyticsResult.success && analyticsResult.data) {
          setAnalytics(analyticsResult.data);
        }
      });
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard allowedRoles={["ADMIN"]} className="container mx-auto p-2 md:p-6 space-y-6">
      <Navbar />

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
            {loading ? (
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[...Array(5)].map((_, i) => (
                        <tr key={i}>
                          <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-24" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  );
}