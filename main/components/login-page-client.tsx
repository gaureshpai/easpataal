"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Eye,
  EyeOff,
  AlertTriangle,
  Users,
  Copy,
  TestTube,
  Loader2,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { demoCredentials } from "@/lib/credentials";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // @ts-ignore - Assuming role is stored in session.user
      const userRole = session.user.role;
      if (userRole) {
        router.push(`/${userRole.toLowerCase()}`);
      }
    }
  }, [status, session, router]);

  const handleRoleChange = (role: string) => {
    setFormData({
      ...formData,
      role,
      username: "",
      password: "",
    });
    setError("");
  };

  const handleDemoCredentialClick = (role: keyof typeof demoCredentials) => {
    const credentials = demoCredentials[role];
    setFormData({
      username: credentials.username,
      password: credentials.password,
      role: role,
    });
    setError("");
    setIsDialogOpen(false);

    toast({
      title: "Demo credentials loaded",
      description: `Loaded ${credentials.username} credentials`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        username: formData.username,
        password: formData.password,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push(`/${formData.role}`);
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid username or password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: text,
    });
  };

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  // Don't render login form if already authenticated
  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white p-3 rounded-full shadow-md">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={72}
                  height={72}
                  className="rounded-full"
                />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">
              EASPATAAL
            </CardTitle>
            <CardDescription className="text-gray-500">
              Sign in to access the hospital management system
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-50 dark:bg-red-900/20"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="pharmacist">Pharmacist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                  disabled={isLoading}
                  className="transition-shadow duration-300 ease-in-out focus:shadow-outline"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    disabled={isLoading}
                    className="pr-10 transition-shadow duration-300 ease-in-out focus:shadow-outline"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Use Demo Credentials
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                      <Users className="h-6 w-6" />
                      Demo Credentials
                    </DialogTitle>
                    <DialogDescription>
                      Click on a role to auto-fill the login form.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
                    {Object.entries(demoCredentials).map(
                      ([role, credentials]) => (
                        <div
                          key={role}
                          className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer"
                          onClick={() =>
                            handleDemoCredentialClick(
                              role as keyof typeof demoCredentials
                            )
                          }
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold capitalize text-lg">
                              {role}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {credentials.username}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center justify-between">
                              <span className="truncate">
                                Username: {credentials.username}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(credentials.username);
                                }}
                                className="h-7 w-7 p-0"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Password: {credentials.password}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(credentials.password);
                                }}
                                className="h-7 w-7 p-0"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                type="submit"
                className="w-full font-semibold text-md"
                disabled={
                  isLoading ||
                  !formData.username ||
                  !formData.password ||
                  !formData.role
                }
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-gray-500 mt-8">
          &copy; {new Date().getFullYear()} EASPATAAL. All rights reserved.
        </p>
      </div>
    </div>
  );
}
