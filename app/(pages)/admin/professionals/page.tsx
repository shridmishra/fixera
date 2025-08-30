'use client'

import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { User, Mail, Phone, Calendar, FileText, CheckCircle, XCircle, Eye, LucideChartNoAxesColumn, ClosedCaption } from "lucide-react"

interface Professional {
  _id: string;
  name: string;
  email: string;
  phone: string;
  professionalStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  hourlyRate?: number;
  currency?: string;
  serviceCategories?: string[];
  businessInfo?: {
    companyName?: string;
    description?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  idProofUrl?: string;
  idProofFileName?: string;
  vatNumber?: string;
  isVatVerified?: boolean;
  createdAt: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export default function ProfessionalsAdminPage() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const status = searchParams.get('status') || 'pending'
  
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, user, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchProfessionals()
    }
  }, [user, status])

  const fetchProfessionals = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/professionals?status=${status}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setProfessionals(data.data.professionals)
      }
    } catch (error) {
      console.error('Failed to fetch professionals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = async (professionalId: string, action: 'approve' | 'reject' | 'suspend', reason?: string) => {
    setActionLoading(professionalId)
    try {
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/professionals/${professionalId}/${action}`
      const body = reason ? { reason } : undefined
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      })

      if (response.ok) {
        fetchProfessionals()
        setSelectedProfessional(null)
      }
    } catch (error) {
      console.error(`Failed to ${action} professional:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'suspended': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-orange-100 text-orange-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'suspended': return <LucideChartNoAxesColumn className="h-4 w-4" />
      default: return <Eye className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto pt-20">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Professional Management
            </h1>
            <p className="text-gray-600">Review and manage professional applications</p>
          </div>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-6 flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
            { key: 'suspended', label: 'Suspended' }
          ].map((tab) => (
            <Button
              key={tab.key}
              onClick={() => router.push(`/admin/professionals?status=${tab.key}`)}
              variant={status === tab.key ? 'default' : 'ghost'}
              className="flex-1"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Professionals List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading professionals...</p>
          </div>
        ) : professionals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No professionals found with status: {status}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {professionals.map((professional) => (
              <Card key={professional._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {professional.name}
                      </CardTitle>
                      <CardDescription>{professional.email}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(professional.professionalStatus)}>
                      {getStatusIcon(professional.professionalStatus)}
                      <span className="ml-1 capitalize">{professional.professionalStatus}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-500" />
                        {professional.phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        Applied: {new Date(professional.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {professional.hourlyRate && (
                        <div className="text-sm">
                          <span className="font-medium">Rate:</span> {professional.currency}{professional.hourlyRate}/hr
                        </div>
                      )}
                      {professional.businessInfo?.companyName && (
                        <div className="text-sm">
                          <span className="font-medium">Company:</span> {professional.businessInfo.companyName}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {professional.serviceCategories && professional.serviceCategories.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Services:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {professional.serviceCategories.slice(0, 3).map((category, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                            {professional.serviceCategories.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{professional.serviceCategories.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {professional.rejectionReason && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</div>
                      <div className="text-sm text-red-700">{professional.rejectionReason}</div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setSelectedProfessional(professional)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>

                    {professional.professionalStatus === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleAction(professional._id, 'approve')}
                          disabled={actionLoading === professional._id}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => {
                            const reason = prompt('Please provide a reason for rejection:')
                            if (reason && reason.trim().length >= 10) {
                              handleAction(professional._id, 'reject', reason)
                            }
                          }}
                          disabled={actionLoading === professional._id}
                          size="sm"
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {professional.professionalStatus === 'approved' && (
                      <Button
                        onClick={() => {
                          const reason = prompt('Please provide a reason for suspension:')
                          if (reason && reason.trim().length >= 10) {
                            handleAction(professional._id, 'suspend', reason)
                          }
                        }}
                        disabled={actionLoading === professional._id}
                        size="sm"
                        variant="destructive"
                      >
                        <ClosedCaption className="h-4 w-4 mr-1" />
                        Suspend
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Professional Details Modal */}
        {selectedProfessional && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Professional Details</h3>
                  <Button onClick={() => setSelectedProfessional(null)} variant="ghost">
                    ×
                  </Button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Personal Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {selectedProfessional.name}</div>
                      <div><span className="font-medium">Email:</span> {selectedProfessional.email}</div>
                      <div><span className="font-medium">Phone:</span> {selectedProfessional.phone}</div>
                      <div><span className="font-medium">VAT Number:</span> {selectedProfessional.vatNumber || 'Not provided'}</div>
                      <div><span className="font-medium">VAT Status:</span> {selectedProfessional.isVatVerified ? 'Verified' : 'Not verified'}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Business Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Company:</span> {selectedProfessional.businessInfo?.companyName || 'Not provided'}</div>
                      <div><span className="font-medium">Rate:</span> {selectedProfessional.currency}{selectedProfessional.hourlyRate}/hr</div>
                      <div><span className="font-medium">Website:</span> {selectedProfessional.businessInfo?.website || 'Not provided'}</div>
                      <div><span className="font-medium">Location:</span> {selectedProfessional.businessInfo?.city}, {selectedProfessional.businessInfo?.country}</div>
                    </div>
                  </div>
                </div>

                {selectedProfessional.businessInfo?.description && (
                  <div>
                    <h4 className="font-medium mb-3">Business Description</h4>
                    <p className="text-sm text-gray-700">{selectedProfessional.businessInfo.description}</p>
                  </div>
                )}

                {selectedProfessional.serviceCategories && selectedProfessional.serviceCategories.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Service Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProfessional.serviceCategories.map((category, index) => (
                        <Badge key={index} variant="outline">{category}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProfessional.idProofUrl && (
                  <div>
                    <h4 className="font-medium mb-3">ID Proof</h4>
                    <p className="text-sm text-blue-600">
                      <a href={selectedProfessional.idProofUrl} target="_blank" rel="noopener noreferrer">
                        {selectedProfessional.idProofFileName || 'View ID Document'}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}