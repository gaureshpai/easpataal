"use client";

import { getPatientsById, getTokenByPatientId, pushFeedback } from "@/lib/serverFunctions";
import { Patient, Prisma } from "@prisma/client";
import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation";

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Patient[]>([]);
  const [tokens, setTokens] = useState<
    Prisma.TokenQueueGetPayload<{
      include: { patient: true };
    }>[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [feedbackToken, setFeedbackToken] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");

  useEffect(() => {
    const storedProfiles = localStorage.getItem("userId");
    if (storedProfiles) {
      (async () => {
        const res = await getPatientsById(JSON.parse(storedProfiles));
        setProfiles(res);
      })();
    }
  }, []);

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
      console.log(permission)
      if (permission !== 'granted') {
        throw new Error('Permission not granted for Notification')
      }
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
  },[])
  useEffect(() => {

    if (selectedProfile === null) {
      return
    }
    let a = setInterval(async () => {
      const fetchedTokens: Prisma.TokenQueueGetPayload<{
        include: { patient: true };
      }>[] = await getTokenByPatientId(selectedProfile);
      setTokens(fetchedTokens);
    }, 10000)
    return () => clearInterval(a);
  }, [selectedProfile])

  const handleProfileSelect = async (profileId: string) => {
    setSelectedProfile(profileId);
    router.push(`/?id=${profileId}`);
    setLoading(true);
    try {
      const fetchedTokens: Prisma.TokenQueueGetPayload<{
        include: { patient: true };
      }>[] = await getTokenByPatientId(profileId);
      setTokens(fetchedTokens);
    } catch (error) {
      console.error("Error fetching tokens:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedProfile(null);
    setTokens([]);
    setActiveTab("current");
    setFeedbackToken(null);
    setRating(0);
    setFeedbackText("");
  };

  const handleSubmitFeedback = async (tokenId: string) => {
    await pushFeedback({ tokenid: tokenId, feedback: feedbackText, rating: rating });
    // Reset feedback state
    setFeedbackToken(null);
    setRating(0);
    setFeedbackText("");

  };

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

  // Calculate people in line before current token
  const calculatePeopleAhead = (currentToken: any) => {
    const sameQueueTokens = tokens.filter(
      (t) =>
        // t.department.id === currentToken.department.id &&
        (t.status === "WAITING" || t.status === "CALLED") &&
        t.id !== currentToken.id
    );

    // Count tokens with lower token number or higher priority that are still waiting
    return sameQueueTokens.filter((t) => {
      if (t.priority === "URGENT" && currentToken.priority !== "URGENT")
        return true;
      if (t.tokenNumber < currentToken.tokenNumber) return true;
      return false;
    }).length;
  };

  // Separate current and history tokens
  const currentTokens = tokens.filter(
    (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED"
  );
  const historyTokens = tokens.filter(
    (t) => t.status === "COMPLETED" || t.status === "CANCELLED"
  );

  const displayedTokens =
    activeTab === "current" ? currentTokens : historyTokens;

  if (!selectedProfile) {
    return (
      <div className="flex flex-col items-start min-h-screen p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="w-full max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">
            Select a Profile
          </h1>
          <p className="text-gray-600 mb-8">
            Choose a profile to view token information
          </p>

          {profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-20">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No profiles available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => handleProfileSelect(profile.id)}
                  className="aspect-square bg-white rounded-2xl shadow-md hover:shadow-xl flex flex-col items-center justify-center p-4 cursor-pointer hover:scale-105 transition-all duration-200 border-2 border-transparent hover:border-purple-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mb-3">
                    <span className="text-2xl font-bold text-white">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-800 text-center text-sm">
                    {profile.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-20">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 bg-white rounded-2xl p-4 shadow-md">
          <div>
            <h1 className="text-xl font-bold text-gray-800">My Tokens</h1>
            <p className="text-sm text-gray-600">
              {profiles.find((p) => p.id === selectedProfile)?.name}
            </p>
          </div>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </button>
        </div>

        {/* Content Area */}
        <div className="mb-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-gray-600">Loading tokens...</p>
            </div>
          ) : displayedTokens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-md">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 text-center">
                {activeTab === "current"
                  ? "No active tokens found"
                  : "No token history available"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedTokens.map((token) => {
                const peopleAhead =
                  activeTab === "current" ? calculatePeopleAhead(token) : 0;

                return (
                  <div
                    key={token.id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden border border-gray-100"
                  >
                    {/* Token Header */}
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm opacity-90">Token Number</p>
                          <p className="text-3xl font-bold">
                            {token.tokenNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              token.status
                            )}`}
                          >
                            {token.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Token Details */}
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Patient Name
                          </p>
                          <p className="font-semibold text-gray-800">
                            {token.patient.name}
                          </p>
                        </div>
                      </div>

                      {/* People Ahead Section - Only for current tokens */}
                      {activeTab === "current" && (
                        <div className="bg-blue-50 rounded-xl p-3 mb-3 border border-blue-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <svg
                                className="w-5 h-5 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                />
                              </svg>
                              <span className="text-sm font-medium text-gray-700">
                                People ahead in queue
                              </span>
                            </div>
                            <span className="text-2xl font-bold text-blue-600">
                              {peopleAhead}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Feedback Section - Only for completed tokens in history */}
                      {activeTab === "history" &&
                        token.status === "COMPLETED" && (
                          <div className="mt-3 border-t pt-3">
                            {feedbackToken === token.id ? (
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-2">
                                    Rate your experience
                                  </p>
                                  <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className="focus:outline-none transition-transform hover:scale-110"
                                      >
                                        <svg
                                          className={`w-8 h-8 ${star <= rating
                                              ? "text-yellow-400 fill-current"
                                              : "text-gray-300"
                                            }`}
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                          />
                                        </svg>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <textarea
                                    value={feedbackText}
                                    onChange={(e) =>
                                      setFeedbackText(e.target.value)
                                    }
                                    placeholder="Share your feedback (optional)"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                                    rows={3}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      handleSubmitFeedback(token.id)
                                    }
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm"
                                  >
                                    Submit Feedback
                                  </button>
                                  <button
                                    onClick={() => {
                                      setFeedbackToken(null);
                                      setRating(0);
                                      setFeedbackText("");
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setFeedbackToken(token.id)}
                                className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition font-medium text-sm flex items-center justify-center gap-2"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                  />
                                </svg>
                                Give Feedback
                              </button>
                            )}
                          </div>
                        )}

                      {/* Additional Info */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {token.priority && (
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            <span
                              className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getPriorityColor(
                                token.priority
                              )}`}
                            >
                              {token.priority} Priority
                            </span>
                          </div>
                        )}
                        {token.estimatedWaitTime !== undefined && activeTab === "current" && (
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                              ~{token.estimatedWaitTime} min
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-2xl mx-auto flex">
          <button
            onClick={() => setActiveTab("current")}
            className={`flex-1 py-4 px-6 flex flex-col items-center justify-center gap-1 transition-all ${activeTab === "current"
                ? "text-purple-600 border-t-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="text-xs font-medium">Current</span>
            {currentTokens.length > 0 && (
              <span className="absolute top-2 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {currentTokens.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-4 px-6 flex flex-col items-center justify-center gap-1 transition-all ${activeTab === "history"
                ? "text-purple-600 border-t-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs font-medium">History</span>
            {historyTokens.length > 0 && (
              <span className="absolute top-2 bg-gray-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {historyTokens.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
