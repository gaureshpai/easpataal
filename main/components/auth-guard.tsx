"use client";

import type React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthGuardProps } from "@/lib/helpers";

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

    if (allowedRoles && !allowedRoles.includes(session?.user?.role)) {
      console.log(session?.user);
      router.push("/unauthorized");
      return;
    }
  }, [session, status, allowedRoles, router]);

  if (
    status === "loading" ||
    !session ||
    (allowedRoles && !allowedRoles.includes(session?.user?.role))
  ) {
    return null;
  }

  return <div className={className}>{children}</div>;
}
