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

export default function UserVerification() {
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [userExists, setUserExists] = useState(true);

  useEffect(() => {
    const userIds = JSON.parse(localStorage.getItem("userId") || "[]");
    const userIdExists = userIds.includes(userId);
    if (userIdExists) {
        router.push("/");
        return;
    }
  }, []);

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
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
      router.push("/");
      return;
    }
    setUserExists(false);
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
            {!userExists && (
              <p className="text-sm text-red-600">
                User does not exist or phone number is incorrect.
              </p>
            )}
            <Button type="submit" className="w-full">
              Verify
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
