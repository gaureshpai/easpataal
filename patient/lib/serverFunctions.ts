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