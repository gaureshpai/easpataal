import { getFeedbackAnalytics } from "@/lib/user-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Star, MessageSquare, User, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FeedbackList } from "@/components/feedback-list";
import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";

export default async function AdminFeedbackPage() {
  const { data, error } = await getFeedbackAnalytics();

  if (error || !data) {
    return <p className="text-red-500 p-4">Error: {error || 'Could not load feedback data.'}</p>;
  }

  const { anonymousFeedbacks, tokenFeedbacks, anonymousFeedbackStats, bestDoctor } = data;

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <Navbar />
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Patient Feedback</h1>
          <p className="text-gray-600 mt-1">Review and address feedback submitted by patients.</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Anonymous Feedbacks</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{anonymousFeedbackStats.totalFeedbacks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Anonymous Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{anonymousFeedbackStats.avgRating ? anonymousFeedbackStats.avgRating.toFixed(1) : 'N/A'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Rated Doctor</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {bestDoctor ? (
                <>
                  <div className="text-2xl font-bold">{bestDoctor.name}</div>
                  <p className="text-xs text-muted-foreground">
                    Avg. rating of {bestDoctor.avgRating.toFixed(1)}
                  </p>
                </>
              ) : (
                <div className="text-lg font-medium">No ratings yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        <FeedbackList anonymousFeedbacks={anonymousFeedbacks} tokenFeedbacks={tokenFeedbacks} />
      </div>
    </AuthGuard>
  );
}