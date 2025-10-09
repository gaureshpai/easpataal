"use client"

import type React from "react"
import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
} from "@/components/ui/alert-dialog"
import { Plus, Edit2, Trash2, Search, Loader2, RefreshCw, Monitor } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { Navbar } from "@/components/navbar"
import { useToast } from "@/hooks/use-toast"

// TODO: Create these actions
import { getAllCountersAction, createCounterAction, updateCounterAction, deleteCounterAction } from "@/lib/counter-actions";
import type { Counter } from "@prisma/client";
import { type CounterFormData } from "@/lib/helpers";

const CounterCRUDPage = () => {
  const [counters, setCounters] = useState<Counter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCounter, setEditingCounter] = useState<Counter | null>(null)
  const [formData, setFormData] = useState<CounterFormData>({
    name: "",
    location: "",
    status: "ACTIVE",
  })
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  useEffect(() => {
    loadCounters()
  }, [])

  const loadCounters = async () => {
    try {
      setLoading(true)
      startTransition(async () => {
        const result = await getAllCountersAction()
        if (result.success && result.data) {
          setCounters(result.data)
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to load counters",
            variant: "destructive",
          })
        }
      })
    } catch (error) {
      console.error("Error loading counters:", error)
      toast({
        title: "Error",
        description: "Failed to load counters",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredCounters = counters.filter(
    (counter) =>
      counter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (counter.location && counter.location.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      status: "ACTIVE",
    })
  }

  const handleCreateCounter = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      startTransition(async () => {
        const formDataObj = new FormData()
        formDataObj.append("name", formData.name)
        formDataObj.append("location", formData.location)
        formDataObj.append("status", formData.status)

        const result = await createCounterAction(formDataObj)

        if (result.success) {
          await loadCounters()
          setIsCreateDialogOpen(false)
          resetForm()

          toast({
            title: "Success",
            description: "Counter created successfully",
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create counter",
            variant: "destructive",
          })
        }
      })
    } catch (error: any) {
      console.error("Error creating counter:", error)
      toast({
        title: "Error",
        description: "Failed to create counter",
        variant: "destructive",
      })
    }
  }

  const handleEditCounter = (counter: Counter) => {
    setEditingCounter(counter)
    setFormData({
      name: counter.name,
      location: counter.location || "",
      status: counter.status as any,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateCounter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCounter) return

    try {
      startTransition(async () => {
        const formDataObj = new FormData()
        formDataObj.append("name", formData.name)
        formDataObj.append("location", formData.location)
        formDataObj.append("status", formData.status)

        const result = await updateCounterAction(editingCounter.id, formDataObj)

        if (result.success) {
          await loadCounters()
          setIsEditDialogOpen(false)
          setEditingCounter(null)
          resetForm()

          toast({
            title: "Success",
            description: "Counter updated successfully",
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update counter",
            variant: "destructive",
          })
        }
      })
    } catch (error: any) {
      console.error("Error updating counter:", error)
      toast({
        title: "Error",
        description: "Failed to update counter",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCounter = async (counterId: string, counterName: string) => {
    try {
      startTransition(async () => {
        const result = await deleteCounterAction(counterId)

        if (result.success) {
          await loadCounters()

          toast({
            title: "Success",
            description: `Counter ${counterName} has been removed`,
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to delete counter",
            variant: "destructive",
          })
        }
      })
    } catch (error: any) {
      console.error("Error deleting counter:", error)
      toast({
        title: "Error",
        description: "Failed to delete counter",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (field: keyof CounterFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSelectChange = (field: keyof CounterFormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value as any }))
  }

  const CounterForm = ({ isEdit = false, onSubmit }: { isEdit?: boolean; onSubmit: (e: React.FormEvent) => void }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Counter Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={handleInputChange("name")}
          placeholder="Enter counter name"
          disabled={isPending}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={handleInputChange("location")}
          placeholder="Enter location"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <Select value={formData.status} onValueChange={handleSelectChange("status")} disabled={isPending}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false)
            } else {
              setIsCreateDialogOpen(false)
            }
          }}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEdit ? "Updating..." : "Creating..."}
            </>
          ) : isEdit ? (
            "Update Counter"
          ) : (
            "Create Counter"
          )}
        </Button>
      </div>
    </form>
  )

  return (
    <AuthGuard allowedRoles={["ADMIN"]} className="container mx-auto p-6 space-y-6">
      <Navbar />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Monitor className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Counter Management</h1>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:space-x-2 space-y-2 md:space-y-0">
          <Button variant="outline" onClick={loadCounters} disabled={isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Counter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xs md:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Counter</DialogTitle>
                <DialogDescription>
                  Add a new counter to the hospital management system.
                </DialogDescription>
              </DialogHeader>
              <CounterForm onSubmit={handleCreateCounter} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Counters</CardTitle>
          <CardDescription>Manage hospital counters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search counters by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCounters.map((counter) => (
                    <tr key={counter.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{counter.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{counter.location || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Badge>{counter.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditCounter(counter)} disabled={isPending}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" disabled={isPending}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Counter</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {counter.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCounter(counter.id, counter.name)}>
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
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xs md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Counter</DialogTitle>
            <DialogDescription>Update counter information.</DialogDescription>
          </DialogHeader>
          <CounterForm isEdit={true} onSubmit={handleUpdateCounter} />
        </DialogContent>
      </Dialog>
    </AuthGuard>
  )
}

export default CounterCRUDPage
