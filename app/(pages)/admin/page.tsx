'use client'

import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  Shield,
  BarChart3,
  Settings
} from "lucide-react"

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    } else if (!loading && user?.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [isAuthenticated, loading, router, user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage professionals, projects, and platform settings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Project Approvals */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/projects/approval')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Project Approvals
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">Pending</div>
              <p className="text-xs text-muted-foreground">
                Review and approve project submissions
              </p>
              <Button className="w-full mt-4" variant="outline">
                <CheckCircle className="h-4 w-4 mr-2" />
                Review Projects
              </Button>
            </CardContent>
          </Card>

          {/* Professional Approvals */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/professionals')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Professional Approvals
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Active</div>
              <p className="text-xs text-muted-foreground">
                Approve new professional registrations
              </p>
              <Button className="w-full mt-4" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Manage Professionals
              </Button>
            </CardContent>
          </Card>

          {/* Loyalty Management */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/loyalty/config')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Loyalty Program
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">Configure</div>
              <p className="text-xs text-muted-foreground">
                Manage loyalty points and rewards
              </p>
              <Button className="w-full mt-4" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configure Loyalty
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="col-span-full lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => router.push('/admin/projects/approval')}
                  className="h-20 bg-blue-600 hover:bg-blue-700"
                >
                  <div className="text-center">
                    <FileText className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Approve Projects</div>
                  </div>
                </Button>

                <Button
                  onClick={() => router.push('/admin/professionals?status=pending')}
                  className="h-20 bg-green-600 hover:bg-green-700"
                >
                  <div className="text-center">
                    <Users className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Approve Professionals</div>
                  </div>
                </Button>

                <Button
                  onClick={() => router.push('/admin/loyalty/config')}
                  className="h-20 bg-purple-600 hover:bg-purple-700"
                >
                  <div className="text-center">
                    <BarChart3 className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Manage Loyalty</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Navigation */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => router.push('/admin/projects/approval')}>
                <FileText className="h-4 w-4 mr-2" />
                Project Approvals
              </Button>
              <Button variant="outline" onClick={() => router.push('/admin/professionals')}>
                <Users className="h-4 w-4 mr-2" />
                Professional Management
              </Button>
              <Button variant="outline" onClick={() => router.push('/admin/loyalty/config')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Loyalty Configuration
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Back to Main Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}