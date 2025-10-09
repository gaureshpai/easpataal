import { DrugInventory, DrugInventoryStatus } from '@prisma/client';

export const drugInventory: Omit<DrugInventory, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    drugName: 'Aspirin',
    currentStock: 1000,
    minStock: 100,
    location: 'Main Pharmacy, Shelf A',
    status: DrugInventoryStatus.NORMAL,
    batchNumber: 'B12345',
    category: 'Pain Reliever',
    expiryDate: new Date('2025-12-31T23:59:59Z'),
  },
  {
    drugName: 'Paracetamol',
    currentStock: 500,
    minStock: 50,
    location: 'Main Pharmacy, Shelf B',
    status: DrugInventoryStatus.NORMAL,
    batchNumber: 'B67890',
    category: 'Pain Reliever',
    expiryDate: new Date('2026-06-30T23:59:59Z'),
  },
];
