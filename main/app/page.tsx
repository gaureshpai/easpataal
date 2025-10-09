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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 md:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white p-2 rounded-md">
              <Image
                src="/logo.png"
                alt="Logo"
                width={64}
                height={64}
                className="rounded-full"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">EASPATAAL</CardTitle>
          <CardDescription>
            Sign in to access the hospital management system
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
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
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
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

              <DialogContent className="max-w-xs md:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Demo Credentials
                  </DialogTitle>
                  <DialogDescription>
                    Click on any credential to auto-fill the login form
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Object.entries(demoCredentials).map(
                    ([role, credentials]) => (
                      <div
                        key={role}
                        className="border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() =>
                          handleDemoCredentialClick(
                            role as keyof typeof demoCredentials
                          )
                        }
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize text-gray-900">
                            {credentials.username}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {role.toUpperCase()}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center justify-between">
                            <span>Username: {credentials.username}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(credentials.username);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
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
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
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
              className="w-full"
              disabled={isLoading || !formData.username || !formData.password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600">
              <p className="font-medium">
                Don't have an account?{" "}
                <a href="/signup" className="text-blue-600 hover:underline">
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}