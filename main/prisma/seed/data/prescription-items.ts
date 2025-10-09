import { PrescriptionItem } from '@prisma/client';

export const prescriptionItems: Omit<PrescriptionItem, 'id' | 'createdAt' | 'updatedAt' | 'prescriptionId' | 'drugId'>[] = [
  {
    dosage: '500mg',
    frequency: 'Twice a day',
    duration: '7 days',
    instructions: 'Take after meals.',
  },
];
