"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTokensByCounterIdAction, TokenQueueData } from "@/lib/token-queue-actions";
import { getCounterByIdAction } from "@/lib/counter-actions";
import { Counter } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Clock, User, CheckCircle, XCircle, PlayCircle } from "lucide-react";

interface TokenDisplayCardProps {
  token: TokenQueueData;
  isCalled: boolean;
}

const TokenDisplayCard: React.FC<TokenDisplayCardProps> = ({ token, isCalled }) => {
  const getStatusColor = (status: TokenQueueData["status"]) => {
    switch (status) {
      case "WAITING":
        return "bg-yellow-100 text-yellow-800";
      case "CALLED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className={`w-full ${isCalled ? "border-4 border-green-500 shadow-lg" : "border border-gray-200"} transition-all duration-300`}>
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
        <CardTitle className="text-2xl font-bold">Token {token.tokenNumber}</CardTitle>
        <Badge className={getStatusColor(token.status)}>{token.status}</Badge>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex items-center text-sm text-gray-600 mb-1">
          <User className="h-4 w-4 mr-2" />
          <span>{token.displayName}</span>
        </div>
        {token.status === "WAITING" && (
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            <span>Est. Wait: {token.estimatedWaitTime} min</span>
          </div>
        )}
        {isCalled && (
          <div className="flex items-center text-green-600 font-semibold mt-2">
            <PlayCircle className="h-5 w-5 mr-2" />
            <span>NOW SERVING</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const TokenDisplayCardSkeleton: React.FC = () => (
  <Card className="w-full border border-gray-200 animate-pulse">
    <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-6 w-20" />
    </CardHeader>
    <CardContent className="p-4 pt-2">
      <div className="flex items-center text-sm text-gray-600 mb-1">
        <Skeleton className="h-4 w-4 mr-2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex items-center text-sm text-gray-600">
        <Skeleton className="h-4 w-4 mr-2" />
        <Skeleton className="h-4 w-24" />
      </div>
    </CardContent>
  </Card>
);

export default function DisplayPage() {
  const params = useParams();
  const counterId = params.id as string;
  const [tokens, setTokens] = useState<TokenQueueData[]>([]);
  const [counter, setCounter] = useState<Counter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisplayData = async () => {
    console.log("Fetching display data for counterId:", counterId);
    setLoading(true);
    setError(null);
    try {
      const [tokensRes, counterRes] = await Promise.all([
        getTokensByCounterIdAction(counterId),
        getCounterByIdAction(counterId),
      ]);

      if (tokensRes.success && tokensRes.data) {
        setTokens(tokensRes.data);
        console.log("Fetched tokens:", tokensRes.data);
      } else {
        setError(tokensRes.error || "Failed to fetch tokens.");
        console.error("Failed to fetch tokens:", tokensRes.error);
      }

      if (counterRes.success && counterRes.data) {
        setCounter(counterRes.data);
        console.log("Fetched counter details:", counterRes.data);
      } else {
        setError(counterRes.error || "Failed to fetch counter details.");
        console.error("Failed to fetch counter details:", counterRes.error);
      }
    } catch (err) {
      console.error("Error fetching display data:", err);
      setError("An unexpected error occurred while fetching display data.");
    } finally {
      setLoading(false);
      console.log("Finished fetching display data.");
    }
  };

  useEffect(() => {
    if (counterId) {
      fetchDisplayData();
      const interval = setInterval(fetchDisplayData, 60000); // Poll every 1 minute
      return () => clearInterval(interval);
    }
  }, [counterId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full space-y-4">
          <Skeleton className="h-10 w-3/4 mx-auto mb-4" />
          <TokenDisplayCardSkeleton />
          <TokenDisplayCardSkeleton />
          <TokenDisplayCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-4 text-red-700">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!counter) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Counter Not Found</h1>
        <p>The specified counter could not be loaded.</p>
      </div>
    );
  }

  const calledToken = tokens.find(token => token.status === "CALLED");
  const waitingTokens = tokens.filter(token => token.status === "WAITING" || token.status === "IN_PROGRESS");

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <div className="w-full mx-auto mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{counter.name}</h1>
        <p className="text-xl text-gray-600">{counter.location || "No specific location"}</p>
        <Separator className="my-4" />
      </div>

      <div className="w-full mx-auto space-y-6">
        {calledToken && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-green-600 mb-4 text-center">Now Serving</h2>
            <TokenDisplayCard token={calledToken} isCalled={true} />
          </div>
        )}

        {waitingTokens.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Waiting Queue</h2>
            <div className="space-y-4">
              {waitingTokens.map((token) => (
                <TokenDisplayCard key={token.id} token={token} isCalled={false} />
              ))}
            </div>
          </div>
        )}

        {!calledToken && waitingTokens.length === 0 && (
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Tokens in Queue</h2>
            <p className="text-gray-600">Please wait for the next token to be called.</p>
          </div>
        )}
      </div>
    </div>
  );
}