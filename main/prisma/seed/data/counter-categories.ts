import { CounterCategory } from '@prisma/client';

export const counterCategories: Omit<CounterCategory, 'id' | 'departmentId'>[] = [
  {
    name: 'Registration',
    description: 'Patient registration and check-in.',
  },
  {
    name: 'Pharmacy',
    description: 'Medication dispensing and prescription fulfillment.',
  },
];
