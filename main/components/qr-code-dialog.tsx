"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {QRCodeCanvas as QRCode} from "qrcode.react";

interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
}

const QrCodeDialog = ({ open, onOpenChange, patientId }: QrCodeDialogProps) => {
  const qrCodeUrl = `https://easpataal-employee.vercel.app/${patientId}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Patient QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR code to view the patient's details.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center mb-2">
          <QRCode value={qrCodeUrl} size={256} />
        </div>
        <p className="py-4 text-center text-sm font-bold text-gray-900">
          QR Code URL: <span className="text-sm font-light">{qrCodeUrl}</span>
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default QrCodeDialog;
