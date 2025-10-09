'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getTokenDisplayData } from '@/lib/token-actions'; // Import the server action

interface TokenData {
  counterName: string;
  current: string | null;
  next: string | null;
  queue: string[];
}

export default function TokenDisplayPage() {
  const { id } = useParams();
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchTokenData = async () => {
        try {
          setLoading(true);
          const { data, error: fetchError } = await getTokenDisplayData(id as string);
          if (fetchError) {
            throw new Error(fetchError);
          }
          setTokenData(data);
        } catch (e: any) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      };

      fetchTokenData();
      const interval = setInterval(fetchTokenData, 5000);
      return () => clearInterval(interval);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-2xl font-semibold text-gray-700">Loading tokens...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-100">
        <p className="text-2xl font-semibold text-red-700">Error: {error}</p>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-2xl font-semibold text-gray-700">No token data available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 text-white p-8 flex flex-col items-center justify-center">
      <h1 className="text-5xl font-extrabold mb-8 text-center drop-shadow-lg">
        Counter {tokenData.counterName || id} Token Display
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {/* Current Token */}
        <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300">
          <h2 className="text-3xl font-bold mb-4 text-white">CURRENT TOKEN</h2>
          <p className="text-7xl font-extrabold text-yellow-300 animate-pulse">
            {tokenData.current || 'N/A'}
          </p>
        </div>

        {/* Next Token */}
        <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300">
          <h2 className="text-3xl font-bold mb-4 text-white">NEXT TOKEN</h2>
          <p className="text-6xl font-extrabold text-green-300">
            {tokenData.next || 'N/A'}
          </p>
        </div>

        {/* Token Queue */}
        <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 col-span-1 md:col-span-1">
          <h2 className="text-3xl font-bold mb-6 text-white text-center">UPCOMING TOKENS</h2>
          {tokenData.queue.length > 0 ? (
            <ul className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
              {tokenData.queue.map((token, index) => (
                <li
                  key={index}
                  className="bg-white bg-opacity-30 rounded-lg p-3 text-2xl font-semibold text-white text-center"
                >
                  {token}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xl text-white text-center opacity-75">No tokens in queue.</p>
          )}
        </div>
      </div>

      <footer className="mt-12 text-white text-lg opacity-80">
        Easpataal Token Management System
      </footer>
    </div>
  );
}
