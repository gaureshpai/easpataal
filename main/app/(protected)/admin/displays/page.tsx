"use client";

import { useEffect, useState } from "react";
import { getAllCountersAction } from "@/lib/counter-actions";
import { Counter } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface CounterDisplayCardProps {
  counter: Counter;
  baseUrl: string;
}

const CounterDisplayCard: React.FC<CounterDisplayCardProps> = ({ counter, baseUrl }) => {
  const { toast } = useToast();
  const displayUrl = `${baseUrl}/display/${counter.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayUrl);
    toast({
      title: "Copied!",
      description: "Display URL copied to clipboard.",
    });
  };

  return (
    <Card className="w-full border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle>{counter.name}</CardTitle>
        <CardDescription>{counter.location || "No location specified"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`url-${counter.id}`} className="sr-only">Display URL</Label>
          <div className="flex space-x-2">
            <Input
              id={`url-${counter.id}`}
              type="text"
              readOnly
              value={displayUrl}
              className="flex-grow"
            />
            <Button variant="secondary" size="icon" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
            <Link href={displayUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex justify-end">
          <Link href={`/admin/counters?edit=${counter.id}`} passHref>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Counter
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

const CounterDisplayCardSkeleton: React.FC = () => (
  <Card className="w-full border border-gray-200 shadow-sm animate-pulse">
    <CardHeader>
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex space-x-2">
        <Skeleton className="h-10 flex-grow" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-9 w-32" />
      </div>
    </CardContent>
  </Card>
);

export default function AdminDisplaysPage() {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }

    const fetchCounters = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAllCountersAction();
        if (res.success && res.data) {
          setCounters(res.data);
        } else {
          setError(res.error || "Failed to fetch counters.");
        }
      } catch (err) {
        console.error("Error fetching counters:", err);
        setError("An unexpected error occurred while fetching counters.");
      } finally {
        setLoading(false);
      }
    };

    fetchCounters();
  }, []);

  if (error) {
    return (
      <AuthGuard allowedRoles={["ADMIN"]}>
        <Navbar />
        <div className="container mx-auto p-6 space-y-6 text-red-700">
          <h1 className="text-3xl font-bold">Error</h1>
          <p>{error}</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <div>
        <Navbar />
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold">Display Management</h1>
          </div>

          <p className="text-gray-600">Manage public display URLs for your counters.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              [...Array(3)].map((_, i) => <CounterDisplayCardSkeleton key={i} />)
            ) : counters.length === 0 ? (
              <p className="col-span-full text-center text-gray-600">No counters found to display.</p>
            ) : (
              counters.map((counter) => (
                <CounterDisplayCard key={counter.id} counter={counter} baseUrl={baseUrl} />
              ))
            )}
          </div>
        </div>
    </div>
  );
}
