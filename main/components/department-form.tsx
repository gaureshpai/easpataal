"use client";

import type React from "react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createDepartmentAction } from "@/lib/department-actions";
import { Loader2 } from "lucide-react";

const DepartmentForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    startTransition(async () => {
      const result = await createDepartmentAction(formData);

      if (result.success) {
        toast({
          title: "Success",
          description: "Department created successfully",
        });
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create department",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Department Name *</Label>
        <Input
          id="name"
          name="name"
          placeholder="Enter department name"
          disabled={isPending}
          required
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Department"
          )}
        </Button>
      </div>
    </form>
  );
};

export default DepartmentForm;
