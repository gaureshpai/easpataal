import { Appointment, AppointmentStatus, AppointmentType } from '@prisma/client';

export const appointments: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'patientId' | 'doctorId'>[] = [
  {
    date: new Date('2024-01-15T11:00:00Z'),
    time: '11:00',
    status: AppointmentStatus.SCHEDULED,
    type: AppointmentType.CONSULTATION,
    notes: 'Annual check-up.',
  },
];
