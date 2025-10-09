import { Department } from '@prisma/client';

export const departments: Omit<Department, 'id'>[] = [
  {
    name: 'None',
    status: 'ACTIVE',
  },
  {
    name: 'Cardiology',
    description: 'Deals with disorders of the heart.',
    location: 'Building A, 1st Floor',
    contactNumber: '123-456-7890',
    email: 'cardiology@hospital.com',
    operatingHours: 'Mon-Fri 9am-5pm',
    status: 'ACTIVE',
    capacity: 20,
    currentOccupancy: 10,
    specializations: ['Interventional Cardiology', 'Electrophysiology'],
    equipment: ['ECG Machine', 'Echocardiogram'],
  },
  {
    name: 'Neurology',
    description: 'Deals with disorders of the nervous system.',
    location: 'Building B, 2nd Floor',
    contactNumber: '123-456-7891',
    email: 'neurology@hospital.com',
    operatingHours: 'Mon-Fri 9am-5pm',
    status: 'ACTIVE',
    capacity: 15,
    currentOccupancy: 5,
    specializations: ['Stroke', 'Epilepsy'],
    equipment: ['EEG Machine', 'MRI Scanner'],
  },
];
