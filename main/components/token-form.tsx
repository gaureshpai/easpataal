"use client"

import type React from "react"
import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

import { getCountersAction } from "@/lib/counter-actions";
import { Counter, CounterCategory } from "@prisma/client";
import { createTokenAction } from "@/lib/token-queue-actions";
import { getCounterCategoriesAction } from "@/lib/counter-category-actions"

interface TokenFormProps {
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const TokenForm = ({ patientId, onSuccess, onCancel }: TokenFormProps) => {
  const [counters, setCounters] = useState<CounterCategory[]>([]);
  const [selectedCounter, setSelectedCounter] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    loadCounters();
  }, []);

  const loadCounters = async () => {
    const result = await getCounterCategoriesAction();
    if (result.success && result.data) {
      setCounters(result.data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const formData = new FormData();
      formData.append("patientId", patientId);
      formData.append("counterId", selectedCounter);

      const result = await createTokenAction(formData);

      if (result.success) {
        toast({
          title: "Success",
          description: "Token created successfully",
        });
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create token",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Select value={selectedCounter} onValueChange={setSelectedCounter} disabled={isPending}>
          <SelectTrigger>
            <SelectValue placeholder="Select counter" />
          </SelectTrigger>
          <SelectContent>
            {counters.map((counter) => (
              <SelectItem key={counter.id} value={counter.id}>
                {counter.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !selectedCounter}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Token...
            </>
          ) : (
            "Create Token"
          )}
        </Button>
      </div>
    </form>
  );
};

export default TokenForm
