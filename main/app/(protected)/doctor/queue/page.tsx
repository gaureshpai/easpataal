import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getDoctorQueueDetailsAction } from "@/lib/token-queue-actions";
import DoctorQueueClient from "@/components/doctor-queue-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserByIdAction } from "@/lib/user-actions";
import { authOptions } from "@/lib/auth";
import { Navbar } from "@/components/navbar";

export default async function DoctorQueuePage() {
  const session = await getServerSession(authOptions)
  console.log(session);
  if(!session?.user){
    redirect("/");
    return;
  } 
  const user = await getUserByIdAction(session.user.id);
  if(!user.success || !user.data || !user.data.counterId){
    redirect("/");
    return;
  } 
  const queueDetailsResponse = await getDoctorQueueDetailsAction(
    user.data.counterId
  );

  if (!queueDetailsResponse.success || !queueDetailsResponse.data) {
    // Handle error, maybe display a message or redirect
    console.error(
      "Failed to fetch doctor queue details:",
      queueDetailsResponse.error
    );
    // For now, redirect to doctor dashboard
    redirect("/doctor");
  }

  const { current, next, recent } = queueDetailsResponse.data;
  console.log(queueDetailsResponse);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Navbar />
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Doctor Queue</h2>
      </div>
      <DoctorQueueClient
        initialCurrentToken={current}
        initialNextTokens={next}
        initialRecentTokens={recent}
        doctorId={session.user.id}
        counterId={session.user.counterId}
      />
    </div>
  );
}
