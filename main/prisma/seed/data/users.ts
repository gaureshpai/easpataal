import { User, Role } from '@prisma/client';

export const users: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    username: 'admin',
    email: 'admin@hospital.com',
    name: 'Admin User',
    password: 'password123', // Will be hashed
    role: Role.ADMIN,
    department: null,
    counterId: null,
    status: 'ACTIVE',
  },
  {
    username: 'doctor_smith',
    email: 'dr.smith@hospital.com',
    name: 'Dr. John Smith',
    password: 'password123', // Will be hashed
    role: Role.DOCTOR,
    department: 'Cardiology',
    counterId: null,
    status: 'ACTIVE',
  },
  {
    username: 'receptionist_jane',
    email: 'jane.doe@hospital.com',
    name: 'Jane Doe',
    password: 'password123', // Will be hashed
    role: Role.RECEPTIONIST,
    department: null,
    counterId: null,
    status: 'ACTIVE',
  },
  {
    username: 'pharmacist_mike',
    email: 'mike.jones@hospital.com',
    name: 'Mike Jones',
    password: 'password123', // Will be hashed
    role: Role.PHARMACIST,
    department: null,
    counterId: null,
    status: 'ACTIVE',
  },
];
