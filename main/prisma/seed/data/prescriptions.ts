import { Prescription, PrescriptionStatus } from '@prisma/client';

export const prescriptions: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt' | 'patientId' | 'doctorId'>[] = [
  {
    status: PrescriptionStatus.PENDING,
    notes: 'Take with food.',
  },
];
