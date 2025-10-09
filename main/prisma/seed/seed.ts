import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { departments } from './data/departments'
import { counterCategories } from './data/counter-categories'
import { users } from './data/users'
import { patients } from './data/patients'
import { counters } from './data/counters'
import { tokenQueues } from './data/token-queues'
import { appointments } from './data/appointments'
import { drugInventory } from './data/drug-inventory'
import { prescriptions } from './data/prescriptions'
import { prescriptionItems } from './data/prescription-items'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding ...')

  // Clear existing data
  await prisma.prescriptionItem.deleteMany({})
  await prisma.prescription.deleteMany({})
  await prisma.appointment.deleteMany({})
  await prisma.tokenQueue.deleteMany({})
  await prisma.counter.deleteMany({})
  await prisma.patient.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.counterCategory.deleteMany({})
  await prisma.department.deleteMany({})
  await prisma.drugInventory.deleteMany({})

  // Seed Departments
  const createdDepartments = await Promise.all(
    departments.map(async (dept) => prisma.department.create({ data: dept }))
  )
  console.log(`${createdDepartments.length} departments created.`)

  // Seed Counter Categories
  const createdCounterCategories = await Promise.all(
    counterCategories.map(async (cat) => {
      const department = createdDepartments.find((d) => d.name === 'Cardiology')
      return prisma.counterCategory.create({
        data: {
          ...cat,
          departmentId: department?.id,
        },
      })
    })
  )
  console.log(`${createdCounterCategories.length} counter categories created.`)

  // Seed Users
  const createdUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10)
      const department = createdDepartments.find((d) => d.name === user.)
      return prisma.user.create({
        data: {
          ...user,
          password: hashedPassword,
          departmentId: department?.id,
        },
      })
    })
  )
  console.log(`${createdUsers.length} users created.`)

  // Seed Patients
  const createdPatients = await Promise.all(
    patients.map((patient) => prisma.patient.create({ data: patient }))
  )
  console.log(`${createdPatients.length} patients created.`)

  // Seed Counters
  const createdCounters = await Promise.all(
    counters.map(async (counter, index) => {
      const category = createdCounterCategories[index % createdCounterCategories.length]
      const department = createdDepartments[index % createdDepartments.length]
      const user = createdUsers.find((u) => u.role === 'RECEPTIONIST')
      return prisma.counter.create({
        data: {
          ...counter,
          categoryId: category.id,
          departmentId: department.id,
          assignedUserId: user?.id ?? null,
        },
      })
    })
  )
  console.log(`${createdCounters.length} counters created.`)

  // Seed Token Queues
  const createdTokenQueues = await Promise.all(
    tokenQueues.map(async (tq, index) => {
      const department = createdDepartments[index % createdDepartments.length]
      const patient = createdPatients[index % createdPatients.length]
      const counter = createdCounters[index % createdCounters.length]
      return prisma.tokenQueue.create({
        data: {
          ...tq,
          departmentId: department.id,
          patientId: patient.id,
          counterId: counter.id,
        },
      })
    })
  )
  console.log(`${createdTokenQueues.length} token queues created.`)

  // Seed Appointments
  const createdAppointments = (
    await Promise.all(
      appointments.map(async (appt) => {
        const patient = createdPatients[0]
        const doctor = createdUsers.find((u) => u.role === 'DOCTOR')
        if (patient && doctor) {
          return prisma.appointment.create({
            data: {
              ...appt,
              patientId: patient.id,
              doctorId: doctor.id,
            },
          })
        }
        return null
      })
    )
  ).filter(Boolean)
  console.log(`${createdAppointments.length} appointments created.`)

  // Seed Drug Inventory
  const createdDrugInventory = await Promise.all(
    drugInventory.map((drug) => prisma.drugInventory.create({ data: drug }))
  )
  console.log(`${createdDrugInventory.length} drug inventory items created.`)

  // Seed Prescriptions
  const createdPrescriptions = (
    await Promise.all(
      prescriptions.map(async (presc) => {
        const patient = createdPatients[0]
        const doctor = createdUsers.find((u) => u.role === 'DOCTOR')
        if (patient && doctor) {
          return prisma.prescription.create({
            data: {
              ...presc,
              patientId: patient.id,
              doctorId: doctor.id,
            },
          })
        }
        return null
      })
    )
  ).filter(Boolean)
  console.log(`${createdPrescriptions.length} prescriptions created.`)

  // Seed Prescription Items
  if (createdPrescriptions.length > 0 && createdDrugInventory.length > 0) {
    const prescription = createdPrescriptions[0]
    const drug = createdDrugInventory[0]
    const createdPrescriptionItems = await Promise.all(
      prescriptionItems.map((item) =>
        prisma.prescriptionItem.create({
          data: {
            ...item,
            prescriptionId: prescription.id,
            drugId: drug.id,
          },
        })
      )
    )
    console.log(`${createdPrescriptionItems.length} prescription items created.`)
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })