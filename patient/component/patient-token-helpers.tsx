import { Patient, Prisma } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/component/ui/card";
import { Button } from "@/component/ui/button";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Skeleton } from "./ui/skeleton";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Smartphone, Loader2 } from "lucide-react";

export function TokenCardSkeleton() {
  return (
    <Card className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-gray-300 to-gray-200 p-4 text-white animate-pulse">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <Skeleton className="h-3 w-20 mb-1" />
            <Skeleton className="h-5 w-28" />
          </div>
        </div>
        <div className="bg-gray-100 rounded-xl p-3 mb-3 border border-gray-200 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-10" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TokenCard({ token, activeTab, peopleAhead, onFeedback, loading, feedbackToken, setFeedbackToken, setRating, setFeedbackText, rating, feedbackText, handleSubmitFeedback }: {
  token: Prisma.TokenQueueGetPayload<{ include: { patient: true } }>;
  activeTab: "current" | "history";
  peopleAhead: number;
  onFeedback: (tokenId: string) => void;
  loading: boolean;
  feedbackToken: string | null;
  setFeedbackToken: (tokenId: string | null) => void;
  setRating: (rating: number) => void;
  setFeedbackText: (text: string) => void;
  rating: number;
  feedbackText: string;
  handleSubmitFeedback: (tokenId: string) => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "WAITING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CALLED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800 border-red-200";
      case "NORMAL":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden border border-gray-100">
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm opacity-90">Token Number</p>
            <p className="text-3xl font-bold">{token.tokenNumber}</p>
          </div>
          <div className="text-right">
            <Badge className={`${getStatusColor(token.status)}`}>{token.status}</Badge>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Patient Name</p>
            <p className="font-semibold text-gray-800">{token.patient.name}</p>
          </div>
        </div>

        {activeTab === "current" && (
          <div className="bg-blue-50 rounded-xl p-3 mb-3 border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">People ahead in queue</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{peopleAhead}</span>
            </div>
          </div>
        )}

        {activeTab === "history" && token.status === "COMPLETED" && (
          <div className="mt-3 border-t pt-3">
            {feedbackToken === token.id ? (
              <FeedbackForm
                onSubmit={(feedback) => {
                  setRating(feedback.rating);
                  setFeedbackText(feedback.text);
                  handleSubmitFeedback(token.id);
                }}
                onCancel={() => setFeedbackToken(null)}
                loading={loading}
              />
            ) : (
              <Button
                onClick={() => onFeedback(token.id)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition font-medium text-sm flex items-center justify-center gap-2"
              >
                <StarIcon className="w-4 h-4" />
                Give Feedback
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-2">
          {token.priority && (
            <div className="flex items-center gap-1">
              <ZapIcon className="w-4 h-4 text-gray-500" />
              <Badge className={`${getPriorityColor(token.priority)}`}>{token.priority} Priority</Badge>
            </div>
          )}
          {token.estimatedWaitTime !== undefined && activeTab === "current" && (
            <div className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <Badge className="bg-indigo-100 text-indigo-800 border border-indigo-200">~{token.estimatedWaitTime} min</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function FeedbackForm({ onSubmit, onCancel, loading }: {
  onSubmit: (feedback: { rating: number; text: string }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Rate your experience</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Button
              key={star}
              onClick={() => setRating(star)}
              className="focus:outline-none transition-transform hover:scale-110"
              variant="ghost"
              size="icon"
            >
              <StarIcon
                className={`w-8 h-8 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
              />
            </Button>
          ))}
        </div>
      </div>
      <div>
        <Textarea
          value={feedbackText}
          onChange={(e: any) => setFeedbackText(e.target.value)}
          placeholder="Share your feedback (optional)"
          rows={3}
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => onSubmit({ rating, text: feedbackText })}
          className="flex-1"
          variant="default"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Feedback"
          )}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function UsersIcon(props: any) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function StarIcon(props: any) {
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
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function ZapIcon(props: any) {
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
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function ClockIcon(props: any) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export function ProfileSelection({ profiles, onSelectProfile, loading }: {
  profiles: Patient[];
  onSelectProfile: (profileId: string) => void;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col items-start min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Select a Profile</h1>
        <p className="text-gray-600 mb-8">Choose a profile to view token information</p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="aspect-square">
                <CardContent className="flex flex-col items-center justify-center p-4">
                  <Skeleton className="w-16 h-16 rounded-full mb-3" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20">
            <Card className="w-full max-w-md text-center p-6">
              <CardHeader className="p-0">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-800">No Patient Profiles Found</CardTitle>
                <CardDescription className="text-gray-600 pt-2">
                  It seems there are no patient profiles linked to this device.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-6">
                <p className="text-gray-700">
                  To view your tokens and manage your appointments, please visit the hospital reception. Ask them to link your mobile number to your patient profile.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {profiles.map((profile) => (
              <Card
                key={profile.id}
                onClick={() => onSelectProfile(profile.id)}
                className="aspect-square bg-white rounded-2xl shadow-md hover:shadow-xl flex flex-col items-center justify-center p-4 cursor-pointer hover:scale-105 transition-all duration-200 border-2 border-transparent hover:border-purple-300"
              >
                <Avatar className="w-16 h-16 mb-3">
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-2xl font-bold">
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold text-gray-800 text-center text-sm">{profile.name}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ... (TokenCard, FeedbackForm, etc.)