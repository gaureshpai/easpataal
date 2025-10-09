"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Star, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FeedbackList({ anonymousFeedbacks, tokenFeedbacks }) {
  const [filter, setFilter] = useState("all"); // 'all', 'anonymous', 'token'

  const combinedFeedbacks = [
    ...anonymousFeedbacks.map(f => ({ ...f, type: 'anonymous' })),
    ...tokenFeedbacks.map(f => ({ ...f, type: 'token' })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredFeedbacks = combinedFeedbacks.filter(f => {
    if (filter === "all") return true;
    return f.type === filter;
  });

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Feedbacks</SelectItem>
            <SelectItem value="anonymous">Anonymous</SelectItem>
            <SelectItem value="token">Token</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        {filteredFeedbacks.length > 0 ? (
          filteredFeedbacks.map((feedback) => (
            <Card key={feedback.id} className="shadow-sm bg-white">
              {feedback.type === 'anonymous' ? (
                <CardHeader>
                  <div className="flex justify-between items-start">
                      <div>
                          <CardTitle className="text-lg">Anonymous</CardTitle>
                          <CardDescription>{new Date(feedback.createdAt).toLocaleString()}</CardDescription>
                      </div>
                      <Badge className={`${{
                          COMPLAINT: 'bg-red-100 text-red-800',
                          SUGGESTION: 'bg-blue-100 text-blue-800',
                          APPRECIATION: 'bg-green-100 text-green-800'
                      }[feedback.category]}`}>{feedback.category}</Badge>
                  </div>
                </CardHeader>
              ) : (
                <CardHeader>
                  <div className="flex justify-between items-start">
                      <div>
                          <CardTitle className="text-lg">{feedback.patient.name}</CardTitle>
                          <CardDescription>Token #{feedback.tokenNumber} - {new Date(feedback.createdAt).toLocaleString()}</CardDescription>
                      </div>
                      {feedback.counter?.assignedUser && (
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {feedback.counter.assignedUser.name}
                          </div>
                      )}
                  </div>
                </CardHeader>
              )}
              <CardContent className="space-y-4">
                <p className="text-gray-800">{feedback.feedback}</p>
                {feedback.rating && (
                  <div className="flex items-center gap-1 text-yellow-500">
                    <span className="font-bold">{feedback.rating}</span>
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-700">No Feedback Yet</h2>
            <p className="text-gray-500 mt-2">Check back later to see what patients are saying.</p>
          </div>
        )}
      </div>
    </div>
  );
}
