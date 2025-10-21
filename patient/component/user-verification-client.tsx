"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/component/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/component/ui/card";
import { Input } from "@/component/ui/input";
import { verifyUser } from "@/lib/serverFunctions";
import { Loader2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";

export default function UserVerification() {
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }
    const userIds = JSON.parse(localStorage.getItem("userId") || "[]");
    const userIdExists = userIds.includes(userId);
    if (userIdExists) {
      router.push("/");
      return;
    }
  }, [router, userId]);

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await verifyUser({ userId, phone });
      if (res) {
        if (localStorage.getItem("userId") === null) {
          const FirstUserId = [userId];
          localStorage.setItem("userId", JSON.stringify(FirstUserId));
        } else {
          const userIds = JSON.parse(localStorage.getItem("userId") || "[]");
          userIds.push(userId);
          localStorage.setItem("userId", JSON.stringify(userIds));
        }
        const check = () => {
          if (!("serviceWorker" in navigator)) {
            throw new Error("No Service Worker support!");
          }
          if (!("PushManager" in window)) {
            throw new Error("No Push API Support!");
          }
        };
        const registerServiceWorker = async () => {
          const swRegistration = await navigator.serviceWorker.register(
            "/service.js"
          );
          navigator.serviceWorker.ready.then((registration) => {
            const userId = localStorage.getItem("userId");
            registration.active?.postMessage({ type: "SET_USER_ID", userId });
          });
          return swRegistration;
        };
        const requestNotificationPermission = async () => {
          const permission = await window.Notification.requestPermission();
          if (permission !== "granted") {
            throw new Error("Permission not granted for Notification");
          }
        };
        const main = async () => {
          check();
          await requestNotificationPermission();
          await registerServiceWorker();
        };

        main();
        toast({
          title: "Success",
          description: "User verified successfully.",
        });
        router.push("/");
        return;
      }
      toast({
        title: "Error",
        description: "User does not exist or phone number is incorrect.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>User Verification</CardTitle>
          <CardDescription>
            Please verify your phone number to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerification} className="space-y-4">
            <div>
              <label
                htmlFor="userId"
                className="block text-sm font-medium text-gray-700"
              >
                User ID
              </label>
              <Input
                id="userId"
                name="userId"
                type="text"
                value={userId}
                readOnly
                className="mt-1 bg-gray-200"
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1"
                placeholder="Enter your phone number"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
