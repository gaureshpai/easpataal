"use server"
import prisma from "./prisma";

export async function verifyUser({userId,phone}:{userId:string,phone:string}){
    const response = await prisma.patient.findUnique({
        where:{id:userId}
    })
    if(response?.phone === phone){
        return true;
    }
    return false;
}

export async function getTokensByProfile(patientId: string) {
  const tokens = await prisma.tokenQueue.findMany({
    where: {
      patientId: patientId,
    },
  });
  return tokens;
}

export async function getPatientsById(patientIds: string[]) {
  const patients = await prisma.patient.findMany({
    where: {
      id: {
        in: patientIds,
      },
    },
  });
  return patients;
}

export async function getTokenByPatientId(patientId: string) {
  const token = await prisma.tokenQueue.findMany({
    where: {
      patientId: patientId,
    },
    include: {
      department: true,
      patient: true,
    },
  });
  return token;
}

export async function getPeopleInTheQueue(TokenId: string) {
  const token = await prisma.tokenQueue.findUnique({
    where: { id: TokenId },
  });

  if (!token) return 0;

  let count = 0;

  if (token.priority === "NORMAL") {
    // Merge NORMAL + URGENT logic into a single query using OR
    count = await prisma.tokenQueue.count({
      where: {
        status: "WAITING",
        counterId: token.counterId,
        OR: [
          {
            priority: "URGENT", // all waiting urgent tokens
          },
          {
            priority: "NORMAL", // normal tokens created before this token
            createdAt: { lt: token.createdAt },
          },
        ],
      },
    });
  } else if (token.priority === "URGENT") {
    // Only count urgent tokens before current token
    count = await prisma.tokenQueue.count({
      where: {
        status: "WAITING",
        priority: "URGENT",
        counterId: token.counterId,
        createdAt: { lt: token.createdAt },
      },
    });
  }

  return count;
}
