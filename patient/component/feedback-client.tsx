"use client";

import { useState } from "react";
import { createFeedback } from "@/lib/serverFunctions";
import { Button } from "@/component/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/component/ui/card";
import { Textarea } from "@/component/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/component/ui/select";
import { Star, MessageSquarePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FeedbackClient() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const ratingValue = formData.get("rating") as string;
    const data = {
      feedback: formData.get("feedback") as string,
      rating: ratingValue ? parseInt(ratingValue, 10) : undefined,
      category: formData.get("category") as any,
    };

    try {
      await createFeedback(data);
      toast({ title: "Success", description: "Feedback submitted successfully" });
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Complaints & Feedback</h1>
          <p className="text-gray-600 mt-1">We value your opinion. Please share your experience with us.</p>
        </header>

        <Card className="mb-8 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquarePlus className="w-6 h-6 text-purple-600" />
              <span>Submit Your Feedback</span>
            </CardTitle>
            <CardDescription>Your feedback is anonymous and helps us improve our services.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <Textarea
                name="feedback"
                placeholder="Share your thoughts..."
                required
                className="min-h-[120px]"
              />
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[150px]">
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPLAINT">Complaint</SelectItem>
                      <SelectItem value="SUGGESTION">Suggestion</SelectItem>
                      <SelectItem value="APPRECIATION">Appreciation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Select name="rating">
                    <SelectTrigger>
                      <SelectValue placeholder="Rate your experience (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(i => (
                        <SelectItem key={i} value={String(i)}>
                          <div className="flex items-center gap-2">{i} <Star className="w-4 h-4 text-yellow-400" /></div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}