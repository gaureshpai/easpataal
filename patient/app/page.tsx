'use client';

import { useEffect, useState } from 'react';

interface Token {
  id: string;
  tokenNumber: string;
  patientId: string;
  patientName: string;
  displayName: string | null;
  departmentId: string;
  departmentName: string;
  status: string;
  priority: string;
  estimatedWaitTime: number;
  actualWaitTime: number | null;
  createdAt: Date;
  updatedAt: Date;
  calledAt: Date | null;
  completedAt: Date | null;
}

export default function Page() {
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<string[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedProfiles = localStorage.getItem('userId');
    if (storedProfiles) {
      setProfiles(JSON.parse(storedProfiles));
    }
  }, []);

  const handleProfileSelect = async (profile: string) => {
    setSelectedProfile(profile);
    setLoading(true);
    try {
      // Replace this with real API call
      const fetchedTokens: Token[] = []; // placeholder
      setTokens(fetchedTokens);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedProfile(null);
    setTokens([]);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'inprogress':
        return 'bg-blue-100 text-blue-800';
      case 'called':
        return 'bg-purple-100 text-purple-800';
      case 'done':
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!selectedProfile) {
    return (
      <div className="flex flex-col items-start min-h-screen p-4 bg-gradient-to-b from-purple-50 to-pink-50">
        <h1 className="text-2xl font-bold mb-4 text-purple-800">
          Select a Profile
        </h1>

       {profiles.length === 0 ? (
  <p className="text-gray-600 text-center mt-8">No profiles available.</p>
) : (
  <div className="flex justify-center items-center min-h-[50vh]">
    <div className="flex flex-wrap justify-center gap-6">
      {profiles.map((profile) => (
        <div
          key={profile}
          onClick={() => handleProfileSelect(profile)}
          className="w-32 h-36 sm:w-36 sm:h-40 bg-white rounded-3xl shadow-lg flex items-center justify-center font-semibold text-purple-700 text-center cursor-pointer hover:scale-105 hover:shadow-2xl transition-all"
        >
          {profile}
        </div>
      ))}
    </div>
  </div>
)}
      </div>
    );
  }

  // Token dashboard (same as before, colorful, mobile-first)
  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-purple-50 to-pink-50">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-purple-800">
            Tokens for {selectedProfile}
          </h1>
          <button
            onClick={handleBack}
            className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full hover:bg-purple-300 transition"
          >
            Back
          </button>
        </div>

        {loading ? (
          <p className="text-gray-600 text-center">Loading tokens...</p>
        ) : tokens.length === 0 ? (
          <p className="text-gray-600 text-center">No tokens found for this profile.</p>
        ) : (
          <div className="space-y-4">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="flex flex-col sm:flex-row justify-between p-4 bg-white rounded-2xl shadow-md hover:shadow-xl transition"
              >
                <div className="mb-2 sm:mb-0">
                  <p className="font-semibold text-gray-800 text-lg">
                    Token: {token.tokenNumber}
                  </p>
                  <p className="text-gray-600">Patient: {token.patientName}</p>
                  <p className="text-gray-600">Department: {token.departmentName}</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                      token.status
                    )}`}
                  >
                    {token.status}
                  </span>
                  {token.priority && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(
                        token.priority
                      )}`}
                    >
                      {token.priority}
                    </span>
                  )}
                  {token.estimatedWaitTime !== undefined && (
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                      ETA: {token.estimatedWaitTime} min
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
