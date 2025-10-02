'use client'

import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Send,
  Plus,
  Briefcase,
  Calendar,
  AlertCircle
} from "lucide-react"

interface Project {
  _id: string
  title: string
  description: string
  status: 'draft' | 'pending_approval' | 'published' | 'rejected'
  category: string
  subprojects: Array<{
    name: string
    description: string
    basePrice: number
    pricingModel: 'fixed' | 'hour' | 'm2' | 'meter'
  }>
  autoSaveTimestamp?: string
  submittedAt?: string
  approvedAt?: string
  adminFeedback?: string
  qualityChecks?: Array<{
    category: string
    status: 'passed' | 'failed'
    message: string
    checkedAt: string
  }>
  createdAt: string
  updatedAt: string
}

export default function ManageProjectsPage() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [drafts, setDrafts] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/professional/projects/manage')
    } else if (!loading && user?.role !== 'professional') {
      router.push('/dashboard')
    }
  }, [isAuthenticated, loading, router, user])

  useEffect(() => {
    if (user?.role === 'professional') {
      fetchProjects()
    }
  }, [user])

  const fetchProjects = async () => {
    setIsLoading(true)
    try {
      // Fetch all projects
      const projectsResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/all`, {
        credentials: 'include'
      })

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        setProjects(projectsData)
        // Also set drafts for backwards compatibility if needed
        setDrafts(projectsData.filter((p: Project) => p.status === 'draft'))
      } else {
        setError('Failed to fetch projects')
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      setError('Failed to fetch projects')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'published':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4" />
      case 'pending_approval':
        return <Clock className="h-4 w-4" />
      case 'published':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const submitProject = async (projectId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${projectId}/submit`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        // Refresh projects after submission
        fetchProjects()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to submit project')
      }
    } catch (error) {
      console.error('Failed to submit project:', error)
      alert('Failed to submit project')
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your projects...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'professional') {
    return null
  }

  const draftProjects = projects.filter(p => p.status === 'draft')
  const pendingProjects = projects.filter(p => p.status === 'pending_approval')
  const publishedProjects = projects.filter(p => p.status === 'published')
  const rejectedProjects = projects.filter(p => p.status === 'rejected')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 md:p-4">
      <div className="max-w-7xl mx-auto pt-16 md:pt-20">
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2 md:gap-3">
              <Briefcase className="h-6 w-6 md:h-8 md:w-8 text-blue-600 flex-shrink-0" />
              <span className="truncate">Manage Projects</span>
            </h1>
            <p className="text-sm md:text-base text-gray-600">Manage your service offerings and project submissions</p>
          </div>
          <Button
            onClick={() => router.push('/projects/create')}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto flex-shrink-0"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Create New Project</span>
            <span className="sm:hidden">New Project</span>
          </Button>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardHeader className="pb-2 px-3 md:px-6">
              <CardTitle className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <FileText className="h-3 w-3 md:h-4 md:w-4 text-gray-500 flex-shrink-0" />
                <span className="truncate">Drafts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6">
              <div className="text-xl md:text-2xl font-bold">{draftProjects.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 px-3 md:px-6">
              <CardTitle className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <Clock className="h-3 w-3 md:h-4 md:w-4 text-yellow-500 flex-shrink-0" />
                <span className="truncate">Pending Review</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6">
              <div className="text-xl md:text-2xl font-bold">{pendingProjects.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 px-3 md:px-6">
              <CardTitle className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-500 flex-shrink-0" />
                <span className="truncate">Published</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6">
              <div className="text-xl md:text-2xl font-bold">{publishedProjects.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 px-3 md:px-6">
              <CardTitle className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <XCircle className="h-3 w-3 md:h-4 md:w-4 text-red-500 flex-shrink-0" />
                <span className="truncate">Rejected</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6">
              <div className="text-xl md:text-2xl font-bold">{rejectedProjects.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="drafts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="drafts">Drafts ({draftProjects.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingProjects.length})</TabsTrigger>
            <TabsTrigger value="published">Published ({publishedProjects.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedProjects.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="drafts" className="space-y-6">
            {draftProjects.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No draft projects</h3>
                  <p className="text-gray-600 mb-4">Create your first project to get started</p>
                  <Button onClick={() => router.push('/projects/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6">
                {draftProjects.map((project) => (
                  <Card key={project._id} className="hover:shadow-md transition-shadow flex flex-col h-full w-full overflow-hidden">
                    <CardHeader className="pb-3 px-3 md:px-6">
                      <div className="flex items-start justify-between gap-2 md:gap-3 mb-2">
                        <CardTitle className="text-sm md:text-lg leading-tight line-clamp-2 min-w-0 flex-1 break-words">{project.title}</CardTitle>
                        <Badge className={`${getStatusColor(project.status)} border flex-shrink-0 text-xs`}>
                          {getStatusIcon(project.status)}
                          <span className="ml-1 capitalize hidden sm:inline">{project.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-3 text-xs md:text-sm break-words">
                        {project.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 md:space-y-4 pt-0 px-3 md:px-6 flex-1 flex flex-col">
                      <div className="text-xs md:text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                          <span className="truncate text-xs">
                            {new Date(project.autoSaveTimestamp || project.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="truncate text-xs">{project.subprojects.length} pricing option{project.subprojects.length !== 1 ? 's' : ''}</div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/projects/create?id=${project._id}`)}
                          className="flex-1 text-xs py-1"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => submitProject(project._id)}
                          className="flex-1 text-xs py-1"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Submit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            {pendingProjects.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending projects</h3>
                  <p className="text-gray-600">Projects you submit will appear here for admin review</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6">
                {pendingProjects.map((project) => (
                  <Card key={project._id} className="hover:shadow-md transition-shadow flex flex-col h-full w-full overflow-hidden">
                    <CardHeader className="pb-3 px-3 md:px-6">
                      <div className="flex items-start justify-between gap-2 md:gap-3 mb-2">
                        <CardTitle className="text-sm md:text-lg leading-tight line-clamp-2 min-w-0 flex-1 break-words">{project.title}</CardTitle>
                        <Badge className={`${getStatusColor(project.status)} border flex-shrink-0 text-xs`}>
                          {getStatusIcon(project.status)}
                          <span className="ml-1 capitalize hidden sm:inline">{project.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-3 text-xs md:text-sm break-words">
                        {project.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 md:space-y-4 pt-0 px-3 md:px-6 flex-1 flex flex-col">
                      <div className="text-xs md:text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                          <span className="truncate text-xs">
                            Submitted: {new Date(project.submittedAt!).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="truncate text-xs">{project.subprojects.length} pricing option{project.subprojects.length !== 1 ? 's' : ''}</div>
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/professional/projects/${project._id}`)}
                          className="flex-1 text-xs py-1"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="published" className="space-y-6">
            {publishedProjects.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No published projects</h3>
                  <p className="text-gray-600">Approved projects will appear here and be visible to customers</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6">
                {publishedProjects.map((project) => (
                  <Card key={project._id} className="hover:shadow-md transition-shadow flex flex-col h-full w-full overflow-hidden">
                    <CardHeader className="pb-3 px-3 md:px-6">
                      <div className="flex items-start justify-between gap-2 md:gap-3 mb-2">
                        <CardTitle className="text-sm md:text-lg leading-tight line-clamp-2 min-w-0 flex-1 break-words">{project.title}</CardTitle>
                        <Badge className={`${getStatusColor(project.status)} border flex-shrink-0 text-xs`}>
                          {getStatusIcon(project.status)}
                          <span className="ml-1 capitalize hidden sm:inline">{project.status}</span>
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-3 text-xs md:text-sm break-words">
                        {project.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 md:space-y-4 pt-0 px-3 md:px-6 flex-1 flex flex-col">
                      <div className="text-xs md:text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                          <span className="truncate text-xs">
                            Published: {new Date(project.approvedAt!).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="truncate text-xs">{project.subprojects.length} pricing option{project.subprojects.length !== 1 ? 's' : ''}</div>
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/professional/projects/${project._id}`)}
                          className="flex-1 text-xs py-1"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-6">
            {rejectedProjects.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No rejected projects</h3>
                  <p className="text-gray-600">Projects that need revisions will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6">
                {rejectedProjects.map((project) => (
                  <Card key={project._id} className="hover:shadow-md transition-shadow border-red-200 flex flex-col h-full w-full overflow-hidden">
                    <CardHeader className="pb-3 px-3 md:px-6">
                      <div className="flex items-start justify-between gap-2 md:gap-3 mb-2">
                        <CardTitle className="text-sm md:text-lg leading-tight line-clamp-2 min-w-0 flex-1 break-words">{project.title}</CardTitle>
                        <Badge className={`${getStatusColor(project.status)} border flex-shrink-0 text-xs`}>
                          {getStatusIcon(project.status)}
                          <span className="ml-1 capitalize hidden sm:inline">{project.status}</span>
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-3 text-xs md:text-sm break-words">
                        {project.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 md:space-y-4 pt-0 px-3 md:px-6 flex-1 flex flex-col">
                      {project.adminFeedback && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-2 md:p-3">
                          <h4 className="font-medium text-red-800 mb-1 text-xs">Admin Feedback:</h4>
                          <p className="text-xs text-red-700 line-clamp-3 break-words">{project.adminFeedback}</p>
                        </div>
                      )}

                      <div className="text-xs md:text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                          <span className="truncate text-xs">
                            Last updated: {new Date(project.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="truncate text-xs">{project.subprojects.length} pricing option{project.subprojects.length !== 1 ? 's' : ''}</div>
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/projects/create?id=${project._id}`)}
                          className="flex-1 text-xs py-1"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Fix & Resubmit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}