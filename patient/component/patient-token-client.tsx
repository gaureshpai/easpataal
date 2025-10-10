"use client"

import { getPatientsById, getTokenByPatientId, pushFeedback } from "@/lib/serverFunctions";
import { Patient, Prisma } from "@prisma/client";
import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ProfileSelection, TokenCard, TokenCardSkeleton } from "./patient-token-helpers";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export default function PatientClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Patient[]>([]);
  const [tokens, setTokens] = useState<
    Prisma.TokenQueueGetPayload<{
      include: { patient: true };
    }>[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [feedbackToken, setFeedbackToken] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");

  useEffect(() => {
    const storedProfiles = localStorage.getItem("userId");
    if (storedProfiles) {
      (async () => {
        try {
          setLoading(true);
          const res = await getPatientsById(JSON.parse(storedProfiles));
          setProfiles(res);
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to fetch profiles.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [toast]);

  useEffect(() => {
    const check = () => {
      if (!('serviceWorker' in navigator)) {
        throw new Error('No Service Worker support!')
      }
      if (!('PushManager' in window)) {
        throw new Error('No Push API Support!')
      }
    }
    const registerServiceWorker = async () => {
      const swRegistration = await navigator.serviceWorker.register('/service.js')
      return swRegistration
    }
    const requestNotificationPermission = async () => {
      const permission = await window.Notification.requestPermission()
      
    }
    const main = async () => {
      check()
      const swRegistration = await registerServiceWorker()
      console.log(swRegistration)
      const permission = await requestNotificationPermission()
    }

    main();
  }, [])
    useEffect(() => {
      const id = searchParams.get('id');
      if(id) {
        const userIds = JSON.parse(localStorage.getItem("userId") || "[]");
        if(!userIds.includes(id)) {
          router.push('/');
          return
        }
        setSelectedProfile(id);
      }
    },[searchParams, router])
  
    useEffect(() => {
      if (selectedProfile === null) {
        return
      }
      const fetchTokens = async () => {
        try {
          setTokensLoading(true);
          const fetchedTokens: Prisma.TokenQueueGetPayload<{
            include: { patient: true };
          }>[] = await getTokenByPatientId(selectedProfile);
          setTokens(fetchedTokens);
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to fetch tokens.",
            variant: "destructive",
          });
        } finally {
          setTokensLoading(false);
        }
      };
  
      fetchTokens();
      const interval = setInterval(fetchTokens, 10000);
      return () => clearInterval(interval);
    }, [selectedProfile, toast])
  
    const handleProfileSelect = async (profileId: string) => {
      setSelectedProfile(profileId);
      router.push(`/?id=${profileId}`);
      setTokensLoading(true);
      try {
        const fetchedTokens: Prisma.TokenQueueGetPayload<{
          include: { patient: true };
        }>[] = await getTokenByPatientId(profileId);
        setTokens(fetchedTokens);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch tokens.",
          variant: "destructive",
        });
      } finally {
        setTokensLoading(false);
      }
    };
  
    const handleBack = () => {
      setSelectedProfile(null);
      router.push(`/`);
      setTokens([]);
      setActiveTab("current");
      setFeedbackToken(null);
      setRating(0);
      setFeedbackText("");
    };
  
    const handleSubmitFeedback = async (tokenId: string) => {
      try {
        await pushFeedback({ tokenid: tokenId, feedback: feedbackText, rating: rating });
        toast({
          title: "Success",
          description: "Feedback submitted successfully.",
        });
        setFeedbackToken(null);
        setRating(0);
        setFeedbackText("");
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to submit feedback.",
          variant: "destructive",
        });
      }
    };
  
    const calculatePeopleAhead = (currentToken: any) => {
      const sameQueueTokens = tokens.filter(
        (t) =>
          (t.status === "WAITING" || t.status === "CALLED") &&
          t.id !== currentToken.id
      );
  
      return sameQueueTokens.filter((t) => {
        if (t.priority === "URGENT" && currentToken.priority !== "URGENT")
          return true;
        if (t.tokenNumber < currentToken.tokenNumber) return true;
        return false;
      }).length;
    };
  
    const currentTokens = tokens.filter(
      (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED"
    );
    const historyTokens = tokens.filter(
      (t) => t.status === "COMPLETED" || t.status === "CANCELLED"
    );
  
    const displayedTokens =
      activeTab === "current" ? currentTokens : historyTokens;
  
    if (!selectedProfile) {
      return <ProfileSelection profiles={profiles} onSelectProfile={handleProfileSelect} loading={loading} />;
    }
  
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="flex justify-between items-center mb-6 bg-white rounded-2xl p-4 shadow-md">
            <div>
              <h1 className="text-xl font-bold text-gray-800">My Tokens</h1>
              <p className="text-sm text-gray-600">
                {profiles.find((p) => p.id === selectedProfile)?.name}
              </p>
            </div>
            <Button onClick={handleBack} variant="outline">
              Back
            </Button>
          </div>
  
          <div className="mb-6">
            {tokensLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <TokenCardSkeleton key={i} />
                ))}
              </div>
            ) : displayedTokens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-md">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <TicketIcon className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-600 text-center">
                  {activeTab === "current"
                    ? "No active tokens found"
                    : "No token history available"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedTokens.map((token) => (
                  <TokenCard
                    key={token.id}
                    token={token}
                    activeTab={activeTab}
                    peopleAhead={calculatePeopleAhead(token)}
                    onFeedback={setFeedbackToken}
                    loading={loading}
                    feedbackToken={feedbackToken}
                    setFeedbackToken={setFeedbackToken}
                    setRating={setRating}
                    setFeedbackText={setFeedbackText}
                    rating={rating}
                    feedbackText={feedbackText}
                    handleSubmitFeedback={handleSubmitFeedback}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
  
        <div className="fixed z-50 bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg h-fit">
          <div className="max-w-7xl mx-auto flex h-full items-center">
            <Button
              onClick={() => setActiveTab("current")}
              variant={activeTab === "current" ? "secondary" : "ghost"}
              className="flex-1 p-6 flex flex-col items-center justify-center gap-1 transition-all"
            >
              <TicketIcon className="w-6 h-6" />
              <span className="text-xs font-medium">Current</span>
              {currentTokens.length > 0 && (
                <Badge className="absolute top-2 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {currentTokens.length}
                </Badge>
              )}
            </Button>
            <Button
              onClick={() => setActiveTab("history")}
              variant={activeTab === "history" ? "secondary" : "ghost"}
              className="flex-1 py-4 px-6 flex flex-col items-center justify-center gap-1 transition-all"
            >
              <HistoryIcon className="w-6 h-6" />
              <span className="text-xs font-medium">History</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  function TicketIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 9a3 3 0 0 1 0 6v1a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-1a3 3 0 0 1 0-6V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <path d="M13 5v2" />
        <path d="M13 17v2" />
        <path d="M13 11v2" />
      </svg>
    )
  }
  
  function HistoryIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    )
  }