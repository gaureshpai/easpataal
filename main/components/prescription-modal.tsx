"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createPrescription, CreatePrescriptionData, getAllDrugsForSelection } from "@/lib/doctor-service";
import { Combobox } from "./ui/combobox";
import { ScrollArea } from "./ui/scroll-area";
import { Loader2 } from "lucide-react";

interface PrescriptionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  doctorUsername: string;
  onPrescriptionAdded: () => void;
}

interface MedicationInput {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export function PrescriptionModal({
  isOpen,
  onOpenChange,
  patientId,
  doctorUsername,
  onPrescriptionAdded,
}: PrescriptionModalProps) {
  const [notes, setNotes] = useState("");
  const [medications, setMedications] = useState<MedicationInput[]>([
    { drugName: "", dosage: "", frequency: "", duration: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [drugOptions, setDrugOptions] = useState<{ label: string; value: string }[]>([]);

  const handleAddMedication = () => {
    setMedications([
      ...medications,
      { drugName: "", dosage: "", frequency: "", duration: "" },
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    const newMedications = [...medications];
    newMedications.splice(index, 1);
    setMedications(newMedications);
  };

  const handleMedicationChange = (
    index: number,
    field: keyof MedicationInput,
    value: string
  ) => {
    const newMedications = [...medications];
    newMedications[index] = { ...newMedications[index], [field]: value };
    setMedications(newMedications);
  };

  const handleDrugSearch = async (query: string) => {
    try {
      const drugs = await getAllDrugsForSelection(query);
      console.log("Fetched drugs:", drugs); // Add this line
      setDrugOptions(drugs.map(drug => ({ label: drug.drugName, value: drug.drugName })));
    } catch (error) {
      console.error("Error searching drugs:", error);
      toast({
        title: "Error",
        description: "Failed to search drugs.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data: CreatePrescriptionData = {
        patientId,
        doctorUsername,
        notes,
        medications: medications.filter(med => med.drugName && med.dosage && med.frequency && med.duration),
      };

      if (data.medications.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one medication.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      await createPrescription(data);
      toast({
        title: "Success",
        description: "Prescription added successfully.",
      });
      onPrescriptionAdded();
      onOpenChange(false);
      setNotes("");
      setMedications([{ drugName: "", dosage: "", frequency: "", duration: "" }]);
    } catch (error: any) {
      console.error("Error creating prescription:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add prescription.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Prescription</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>

            <h3 className="text-lg font-semibold mt-4">Medications</h3>
            {medications.map((med, index) => (
              <div key={index} className="grid gap-2 border p-3 rounded-md relative">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`drugName-${index}`} className="text-right">
                    Drug Name
                  </Label>
                  <div className="col-span-3">
                    <Combobox
                      options={drugOptions}
                      value={med.drugName}
                      onValueChange={(value) => handleMedicationChange(index, "drugName", value)}
                      onInputChange={handleDrugSearch}
                      placeholder="Select drug"
                      noResultsText="No drugs found."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`dosage-${index}`} className="text-right">
                    Dosage
                  </Label>
                  <Input
                    id={`dosage-${index}`}
                    value={med.dosage}
                    onChange={(e) => handleMedicationChange(index, "dosage", e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`frequency-${index}`} className="text-right">
                    Frequency
                  </Label>
                  <Input
                    id={`frequency-${index}`}
                    value={med.frequency}
                    onChange={(e) => handleMedicationChange(index, "frequency", e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`duration-${index}`} className="text-right">
                    Duration
                  </Label>
                  <Input
                    id={`duration-${index}`}
                    value={med.duration}
                    onChange={(e) => handleMedicationChange(index, "duration", e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`instructions-${index}`} className="text-right">
                    Instructions
                  </Label>
                  <Input
                    id={`instructions-${index}`}
                    value={med.instructions || ""}
                    onChange={(e) => handleMedicationChange(index, "instructions", e.target.value)}
                    className="col-span-3"
                  />
                </div>
                {medications.length > 1 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveMedication(index)}
                    className="absolute top-2 right-2"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={handleAddMedication}>
              Add Another Medication
            </Button>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Prescription"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}