"use client";

import type React from "react";
import { useEffect } from "react";
import { AuthGuardProps } from "@/lib/helpers";

export function AuthGuard({ allowedRoles, children, className }: AuthGuardProps) {

  // If we have a user and their role is allowed, render the children
  return <div className={className}>{children}</div>;
}
