import type { Metadata } from "next";
import CounterCRUDPage from "@/components/admin-counters-client";

import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CounterManagement from "@/components/counter-management";
import CounterCategoryManagement from "@/components/counter-category-management";

export default function CounterCRUDPage() {
  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <Tabs defaultValue="counters" className="space-y-6">
          <TabsList>
            <TabsTrigger value="counters">Counters</TabsTrigger>
            <TabsTrigger value="categories">Counter Categories</TabsTrigger>
          </TabsList>
          <TabsContent value="counters">
            <CounterManagement />
          </TabsContent>
          <TabsContent value="categories">
            <CounterCategoryManagement />
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}
