"use client";

import type React from "react";
import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  RefreshCw,
  LayoutGrid,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Department } from "@prisma/client";

const CounterCategoryForm = ({
  onSubmit,
  isPending,
  setIsCreateCounterCategoryDialogOpen,
  departments,
}: {
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  setIsCreateCounterCategoryDialogOpen: (isOpen: boolean) => void;
  departments: Department[];
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="name">Category Name *</Label>
      <Input id="name" name="name" placeholder="Enter category name" required />
    </div>
    <div className="space-y-2">
      <Label htmlFor="departmentId">Department</Label>
      <Select name="departmentId" onValueChange={(value) => {
        const form = (document.querySelector("form"))!;
        const input = form.querySelector("input[name='departmentId']") as HTMLInputElement;
        if(input) input.value = value;
      }}>
        <SelectTrigger>
          <SelectValue placeholder="Select department" />
        </SelectTrigger>
        <SelectContent>
          {/*<SelectItem value="none">None</SelectItem>*/}
          {departments.map((dept) => (
            <SelectItem key={dept.id} value={dept.id}>
              {dept.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input type="hidden" name="departmentId" />
    </div>
    <div className="flex justify-end space-x-2 pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsCreateCounterCategoryDialogOpen(false)}
        disabled={isPending}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Category"}
      </Button>
    </div>
  </form>
);

import EditCounterCategoryForm from "./edit-counter-category-form";

import { getDepartmentsAction } from "@/lib/department-actions";
import { createCounterCategoryAction, deleteCounterCategoryAction, getAllCounterCategoriesAction } from "@/lib/counter-category-actions";

const CounterCategoryManagement = () => {
  const [counterCategories, setCounterCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateCounterCategoryDialogOpen, setIsCreateCounterCategoryDialogOpen] =
    useState(false);
  const [isEditCounterCategoryDialogOpen, setIsEditCounterCategoryDialogOpen] =
    useState(false);
  const [editingCounterCategory, setEditingCounterCategory] = useState<any | null>(
    null
  );
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    loadCounterCategories();
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const result = await getDepartmentsAction();
      if (result.success && result.data) {
        setDepartments(result.data);
      }
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  };

  const loadCounterCategories = async () => {
    try {
      setLoading(true);
      const result = await getAllCounterCategoriesAction();
      if (result.success && result.data) {
        setCounterCategories(result.data);
      }
    } catch (error) {
      console.error("Error loading counter categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCounterCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    try {
      startTransition(async () => {
        const result = await createCounterCategoryAction(formData);

        if (result.success) {
          toast({
            title: "Success",
            description: "Counter category created successfully",
          });
          setIsCreateCounterCategoryDialogOpen(false);
          await loadCounterCategories();
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create counter category",
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      console.error("Error creating counter category:", error);
      toast({
        title: "Error",
        description: "Failed to create counter category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCounterCategory = async (id: string, name: string) => {
    try {
      startTransition(async () => {
        const result = await deleteCounterCategoryAction(id);

        if (result.success) {
          toast({
            title: "Success",
            description: `Counter category ${name} deleted successfully`,
          });
          await loadCounterCategories();
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to delete counter category",
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      console.error("Error deleting counter category:", error);
      toast({
        title: "Error",
        description: "Failed to delete counter category",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center mb-6 md:justify-between gap-4 mt-8">
        <div className="flex items-center space-x-2">
          <LayoutGrid className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Counter Category Management</h1>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:space-x-2 space-y-2 md:space-y-0">
          <Button
            variant="outline"
            onClick={loadCounterCategories}
            disabled={isPending}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isPending ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Dialog
            open={isCreateCounterCategoryDialogOpen}
            onOpenChange={setIsCreateCounterCategoryDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xs md:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Counter Category</DialogTitle>
                <DialogDescription>
                  Add a new counter category to the system.
                </DialogDescription>
              </DialogHeader>
              <CounterCategoryForm
                onSubmit={handleCreateCounterCategory}
                isPending={isPending}
                setIsCreateCounterCategoryDialogOpen={
                  setIsCreateCounterCategoryDialogOpen
                }
                departments={departments}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Counter Categories</CardTitle>
          <CardDescription>Manage counter categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Counters
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">                      Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton className="h-4 w-32" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton className="h-4 w-32" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton className="h-4 w-24" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Counters
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">                      Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {counterCategories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {category.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {category.department?.name || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {category._count.counters}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingCounterCategory(category);
                                setIsEditCounterCategoryDialogOpen(true);
                              }}
                              disabled={isPending}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isPending}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Counter Category
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {category.name}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteCounterCategory(
                                        category.id,
                                        category.name
                                      )
                                    }
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Dialog
        open={isEditCounterCategoryDialogOpen}
        onOpenChange={setIsEditCounterCategoryDialogOpen}
      >
        <DialogContent className="max-w-xs md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Counter Category</DialogTitle>
            <DialogDescription>
              Update the counter category information.
            </DialogDescription>
          </DialogHeader>
          {editingCounterCategory && (
            <EditCounterCategoryForm
              category={editingCounterCategory}
              departments={departments}
              onSuccess={() => {
                setIsEditCounterCategoryDialogOpen(false);
                loadCounterCategories();
              }}
              onCancel={() => setIsEditCounterCategoryDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CounterCategoryManagement;
