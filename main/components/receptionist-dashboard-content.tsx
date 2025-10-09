"use client"

import type React from "react"
import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Search, Users, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast"
import PatientForm from "@/components/patient-form"

import { getAllPatientsAction, searchPatientsAction } from "@/lib/patient-actions";
import { createTokenAction } from "@/lib/token-queue-actions";
import type { Patient } from "@prisma/client";
import TokenForm from "./token-form"

const ReceptionistDashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreatePatientDialogOpen, setIsCreatePatientDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    try {
      setLoading(true)
      startTransition(async () => {
        const result = await getAllPatientsAction()
        if (result.success && result.data) {
          setPatients(result.data)
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to load patients",
            variant: "destructive",
          })
        }
      })
    } catch (error) {
      console.error("Error loading patients:", error)
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.phone && patient.phone.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const [isCreateTokenDialogOpen, setIsCreateTokenDialogOpen] = useState(false);

  const handleCreatePatientSuccess = () => {
    setIsCreatePatientDialogOpen(false);
    loadPatients();
  };

  const handleCreateTokenSuccess = () => {
    setIsCreateTokenDialogOpen(false);
    loadPatients();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Patient Management</h1>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:space-x-2 space-y-2 md:space-y-0">
          <Button variant="outline" onClick={loadPatients} disabled={isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Dialog open={isCreatePatientDialogOpen} onOpenChange={setIsCreatePatientDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xs md:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Patient</DialogTitle>
                <DialogDescription>
                  Add a new patient to the hospital management system.
                </DialogDescription>
              </DialogHeader>
              <PatientForm onSuccess={handleCreatePatientSuccess} onCancel={() => setIsCreatePatientDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patients</CardTitle>
          <CardDescription>Manage hospital patients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search patients by name or phone..."
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
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{patient.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{patient.phone || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Dialog open={isCreateTokenDialogOpen} onOpenChange={setIsCreateTokenDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" disabled={isPending}>
                                Create Token
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Create Token for {patient.name}</DialogTitle>
                              </DialogHeader>
                              <TokenForm patientId={patient.id} onSuccess={handleCreateTokenSuccess} onCancel={() => setIsCreateTokenDialogOpen(false)} />
                            </DialogContent>
                          </Dialog>
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
    </div>
  )
}

export default ReceptionistDashboard