"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TokenQueueData,
  callNextTokenAction,
  getDoctorQueueDetailsAction,
  updateTokenStatusAction,
} from "@/lib/token-queue-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { PrescriptionModal } from "./prescription-modal"; // Import the modal

interface DoctorQueueClientProps {
  initialCurrentToken: TokenQueueData | null;
  initialNextTokens: TokenQueueData[];
  initialRecentTokens: TokenQueueData[];
  doctorId: string;
  counterId: string;
}

export default function DoctorQueueClient({
  initialCurrentToken,
  initialNextTokens,
  initialRecentTokens,
  doctorId,
  counterId,
}: DoctorQueueClientProps) {
  const [currentToken, setCurrentToken] = useState<TokenQueueData | null>(
    initialCurrentToken
  );
  const [nextTokens, setNextTokens] =
    useState<TokenQueueData[]>(initialNextTokens);
  const [recentTokens, setRecentTokens] =
    useState<TokenQueueData[]>(initialRecentTokens);
  const [loading, setLoading] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false); // State for modal
  const router = useRouter();
  const { toast } = useToast();

  const refreshQueue = async () => {
    setLoading(true);
    const response = await getDoctorQueueDetailsAction(counterId);
    if (response.success && response.data) {
      setCurrentToken(response.data.current);
      setNextTokens(response.data.next);
      setRecentTokens(response.data.recent);
    } else {
      toast({
        title: "Error",
        description: response.error || "Failed to refresh queue.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleNextToken = async () => {
    setLoading(true);
    const response = await callNextTokenAction(doctorId);
    console.log(response);
    if (response.success) {
      toast({
        title: "Success",
        description: `Token ${response.data?.tokenNumber} called.`,
      });
      await refreshQueue();
    } else {
      toast({
        title: "Error",
        description: response.error || "Failed to call next token.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleCompleteToken = async () => {
    if (!currentToken) return;
    setLoading(true);
    const response = await updateTokenStatusAction(
      currentToken.id,
      "COMPLETED"
    );
    if (response.success) {
      toast({
        title: "Success",
        description: `Token ${response.data?.tokenNumber} completed.`,
      });
      await refreshQueue();
    } else {
      toast({
        title: "Error",
        description: response.error || "Failed to complete token.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleAddPrescription = () => {
    if (currentToken) {
      setIsPrescriptionModalOpen(true); // Open the modal
    } else {
      toast({
        title: "Info",
        description: "No current token to add prescription for.",
      });
    }
  };

  const handlePrescriptionAdded = () => {
    refreshQueue(); // Refresh the queue after a prescription is added
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Current Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentToken ? (
            <>
              <div className="text-center text-6xl font-bold">
                {currentToken.tokenNumber}
              </div>
              <p className="text-center text-xl">
                Patient: {currentToken.patientName}
              </p>
              <div className="flex justify-center gap-2">
                <Badge variant="secondary">{currentToken.priority}</Badge>
                <Badge variant="outline">{currentToken.status}</Badge>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <Button
                  onClick={handleAddPrescription}
                  disabled={loading}
                  className="w-full"
                >
                  Add Prescription
                </Button>
                <Button
                  onClick={handleCompleteToken}
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  Complete Token
                </Button>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground">
              No token currently being served.
            </p>
          )}
          <Button onClick={handleNextToken} disabled={loading} className="w-full mt-4">
            {currentToken ? "Call Next Token" : "Start Queue"}
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Next Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {nextTokens.length > 0 ? (
              <div className="space-y-2">
                {nextTokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">Token: {token.tokenNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Patient: {token.patientName}
                      </p>
                    </div>
                    <Badge>{token.priority}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                No waiting tokens.
              </p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Recent Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {recentTokens.length > 0 ? (
              <div className="space-y-2">
                {recentTokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">Token: {token.tokenNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Patient: {token.patientName}
                      </p>
                    </div>
                    <Badge variant="outline">{token.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                No recent tokens.
              </p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {currentToken && (
        <PrescriptionModal
          isOpen={isPrescriptionModalOpen}
          onOpenChange={setIsPrescriptionModalOpen}
          patientId={currentToken.patientId}
          doctorUsername={doctorId} // Assuming doctorId is the username
          onPrescriptionAdded={handlePrescriptionAdded}
        />
      )}
    </div>
  );
}
