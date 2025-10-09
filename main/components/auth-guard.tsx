"use client";

import type React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthGuardProps } from "@/lib/helpers";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthGuard({
  children,
  allowedRoles,
  className,
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Do nothing while loading
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (session && allowedRoles && !allowedRoles.includes(session.user?.role)) {
      router.push('/');
      return;
    }
  }, [session, status, allowedRoles, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (
    !session ||
    (session && allowedRoles && !allowedRoles.includes(session.user?.role))
  ) {
    return null;
  }

  return <div className={className}>{children}</div>;
}
