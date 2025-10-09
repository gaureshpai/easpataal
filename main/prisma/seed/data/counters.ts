import { Counter } from '@prisma/client';

export const counters: Omit<Counter, 'id' | 'createdAt' | 'updatedAt' | 'categoryId' | 'departmentId' | 'assignedUserId'>[] = [
  {
    name: 'Registration Desk 1',
    location: 'Building A, Lobby',
    status: 'ACTIVE',
  },
  {
    name: 'Pharmacy Counter 1',
    location: 'Building C, 1st Floor',
    status: 'ACTIVE',
  },
];
