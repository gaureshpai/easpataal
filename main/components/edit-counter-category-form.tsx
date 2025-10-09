"use client";

import type React from "react";
import { useState, useEffect, useTransition } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { updateCounterCategoryAction } from "@/lib/counter-category-actions";

const EditCounterCategoryForm = ({
  category,
  departments,
  onSuccess,
  onCancel,
}: {
  category: any;
  departments: any[];
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    departmentId: category?.departmentId || "",
  });
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, departmentId: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const formDataObj = new FormData();
      formDataObj.append("name", formData.name);
      formDataObj.append("departmentId", formData.departmentId);

      const result = await updateCounterCategoryAction(category.id, formDataObj);

      if (result.success) {
        toast({
          title: "Success",
          description: "Counter category updated successfully",
        });
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update counter category",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Category Name *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter category name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="departmentId">Department</Label>
        <Select
          name="departmentId"
          value={formData.departmentId}
          onValueChange={handleSelectChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {/* <SelectItem value="none">None</SelectItem> */}
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Updating..." : "Update Category"}
        </Button>
      </div>
    </form>
  );
};

export default EditCounterCategoryForm;
