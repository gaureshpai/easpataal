"use client"

import type React from "react"
import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Monitor, Users, AlertTriangle, Plus, Trash2, CheckCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Navbar } from "@/components/navbar"
import { AuthGuard } from "@/components/auth-guard"
import { getAllDisplaysAction } from "@/lib/display-actions"
import type { DisplayData } from "@/lib/helpers"
import {
  getAllContentAction,
  getAllAnnouncementsAction,
  createAnnouncementAction,
  deleteAnnouncementAction,
  resolveAnnouncementAction,
  getSystemAnalyticsAction,
  type ContentItem,
  type Announcement,
} from "@/lib/content-actions"
import { useToast } from "@/hooks/use-toast"

export default function AdminPanel() {
  const [displays, setDisplays] = useState<DisplayData[]>([])
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [announcementsLoading, setAnnouncementsLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(true)

  const [isPending, startTransition] = useTransition()
  const { user } = useAuth()
  const { toast } = useToast()

  const [newAnnouncement, setNewAnnouncement] = useState("")
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false)

  useEffect(() => {
    fetchInitialData()

    const interval = setInterval(() => {
      fetchRealTimeData()
    }, 100000)

    return () => clearInterval(interval)
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)

      startTransition(async () => {
        const displaysResult = await getAllDisplaysAction()
        if (displaysResult.success && displaysResult.data) {
          setDisplays(displaysResult.data)
        }

        setContentLoading(true)
        const contentResult = await getAllContentAction()
        if (contentResult.success && contentResult.data) {
          setContentItems(contentResult.data)
        }
        setContentLoading(false)

        setAnnouncementsLoading(true)
        const announcementsResult = await getAllAnnouncementsAction()
        if (announcementsResult.success && announcementsResult.data) {
          setAnnouncements(announcementsResult.data)
        }
        setAnnouncementsLoading(false)

        const analyticsResult = await getSystemAnalyticsAction()
        if (analyticsResult.success && analyticsResult.data) {
          setAnalytics(analyticsResult.data)
        }
      })
    } catch (error) {
      console.error("Error fetching initial data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRealTimeData = async () => {
    try {
      startTransition(async () => {
        const analyticsResult = await getSystemAnalyticsAction()
        if (analyticsResult.success && analyticsResult.data) {
          setAnalytics(analyticsResult.data)
        }

        const displaysResult = await getAllDisplaysAction()
        if (displaysResult.success && displaysResult.data) {
          setDisplays(displaysResult.data)
        }
      })
    } catch (error) {
      console.error("Error fetching real-time data:", error)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      setAnnouncementsLoading(true)
      const announcementsResult = await getAllAnnouncementsAction()
      if (announcementsResult.success && announcementsResult.data) {
        setAnnouncements(announcementsResult.data)
      }
    } catch (error) {
      console.error("Error fetching announcements:", error)
    } finally {
      setAnnouncementsLoading(false)
    }
  }

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!newAnnouncement.trim()) {
      toast({
        title: "Error",
        description: "Announcement text is required",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append("text", newAnnouncement)
      formData.append("createdBy", user?.name || "admin")

      const result = await createAnnouncementAction(formData)

      if (result.success) {
        toast({
          title: "Announcement Published",
          description: "Your announcement has been published successfully",
          variant: "default",
        })
        setNewAnnouncement("")
        setIsAnnouncementDialogOpen(false)

        fetchAnnouncements()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to publish announcement",
          variant: "destructive",
        })
      }
    })
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return

    startTransition(async () => {
      const result = await deleteAnnouncementAction(id)

      if (result.success) {
        toast({
          title: "Announcement Deleted",
          description: "The announcement has been removed",
          variant: "default",
        })

        fetchAnnouncements()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete announcement",
          variant: "destructive",
        })
      }
    })
  }

  const handleResolveAnnouncement = async (id: string) => {
    startTransition(async () => {
      const result = await resolveAnnouncementAction(id)

      if (result.success) {
        toast({
          title: "Announcement Resolved",
          description: "The announcement has been marked as resolved",
          variant: "default",
        })

        fetchAnnouncements()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to resolve announcement",
          variant: "destructive",
        })
      }
    })
  }

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
    </div>
  )

  return (
    <AuthGuard allowedRoles={["admin"]} className="container mx-auto p-2 md:p-6 space-y-6">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="w-full flex flex-col md:flex-row bg-white">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Displays</CardTitle>
                  <Monitor className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.displays?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">Across all departments</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Online Displays</CardTitle>
                  <Monitor className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.displays?.online || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Daily Patients</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.patients?.daily || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics?.patients?.change > 0 ? "+" : ""}
                    {analytics?.patients?.change || 0} from yesterday
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Emergency Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.alerts?.weekly || 0}</div>
                  <p className="text-xs text-muted-foreground">This week</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Real-time monitoring of display network health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Network Connectivity</span>
                    <span className="text-sm text-green-600">{analytics?.performance?.networkConnectivity || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Content Sync Rate</span>
                    <span className="text-sm text-green-600">{analytics?.performance?.contentSyncRate || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Response Time</span>
                    <span className="text-sm text-blue-600">{analytics?.performance?.responseTime || 0}s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Error Rate</span>
                    <span className="text-sm text-yellow-600">{analytics?.performance?.errorRate || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </AuthGuard>
  )
}