"use client";

import type React from "react";
import { useState, useTransition } from "react";
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
import { Loader2 } from "lucide-react";

import {
  createPatientAction,
  updatePatientAction,
} from "@/lib/patient-actions";
import { Patient } from "@prisma/client";

interface PatientFormProps {
  patient?: Patient;
  onSuccess: () => void;
  onCancel: () => void;
}

const PatientForm = ({ patient, onSuccess, onCancel }: PatientFormProps) => {
  const [formData, setFormData] = useState({
    name: patient?.name || "",
    phone: patient?.phone || "",
    age: patient?.age.toString() || "",
    gender: patient?.gender || "",
    bloodType: patient?.bloodType || "",
  });
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

  const handleSelectChange =
    (field: keyof typeof formData) => (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const formDataObj = new FormData();
      formDataObj.append("name", formData.name);
      formDataObj.append("phone", formData.phone);
      formDataObj.append("age", formData.age);
      formDataObj.append("gender", formData.gender);

      const result = patient
        ? await updatePatientAction(patient.id, formDataObj)
        : await createPatientAction(formDataObj);

      if (result.success) {
        toast({
          title: "Success",
          description: `Patient ${
            patient ? "updated" : "created"
          } successfully`,
        });
        onSuccess();
      } else {
        toast({
          title: "Error",
          description:
            result.error ||
            `Failed to ${patient ? "update" : "create"} patient`,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Patient Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={handleInputChange("name")}
            placeholder="Enter patient name"
            disabled={isPending}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={handleInputChange("phone")}
            placeholder="Enter phone number"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            value={formData.age}
            onChange={handleInputChange("age")}
            placeholder="Enter age"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={formData.gender}
            onValueChange={handleSelectChange("gender")}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bloodType">Blood Type</Label>
          <Select
            value={formData.bloodType}
            onValueChange={handleSelectChange("bloodType")}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select blood type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A_POS">A+</SelectItem>
              <SelectItem value="A_NEG">A-</SelectItem>
              <SelectItem value="B_POS">B+</SelectItem>
              <SelectItem value="B_NEG">B-</SelectItem>
              <SelectItem value="AB_POS">AB+</SelectItem>
              <SelectItem value="AB_NEG">AB-</SelectItem>
              <SelectItem value="O_POS">O+</SelectItem>
              <SelectItem value="O_NEG">O-</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {patient ? "Updating..." : "Creating..."}
            </>
          ) : patient ? (
            "Update Patient"
          ) : (
            "Create Patient"
          )}
        </Button>
      </div>
    </form>
  );
};

export default PatientForm;
