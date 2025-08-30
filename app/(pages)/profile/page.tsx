'use client'

import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Phone, Shield, Calendar, Building, Check, X, AlertCircle, Loader2, Upload, FileText, Clock, MapPin, DollarSign, Tags, CalendarX } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  validateVATFormat, 
  validateVATWithAPI, 
  updateUserVAT, 
  isEUVatNumber, 
  getVATCountryName,
  formatVATNumber 
} from "@/lib/vatValidation"

export default function ProfilePage() {
  const { user, isAuthenticated, loading, checkAuth } = useAuth()
  const router = useRouter()
  const [vatNumber, setVatNumber] = useState('')
  const [vatValidating, setVatValidating] = useState(false)
  const [vatSaving, setVatSaving] = useState(false)
  const [vatValidation, setVatValidation] = useState<{
    valid?: boolean
    error?: string
    companyName?: string
    companyAddress?: string
  }>({})

  // Professional profile states
  const [idProofFile, setIdProofFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [businessInfo, setBusinessInfo] = useState({
    companyName: '',
    description: '',
    website: '',
    address: '',
    city: '',
    country: '',
    postalCode: ''
  })
  const [hourlyRate, setHourlyRate] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [serviceCategories, setServiceCategories] = useState<string[]>([])
  const [availability, setAvailability] = useState({
    monday: { available: false, startTime: '09:00', endTime: '17:00' },
    tuesday: { available: false, startTime: '09:00', endTime: '17:00' },
    wednesday: { available: false, startTime: '09:00', endTime: '17:00' },
    thursday: { available: false, startTime: '09:00', endTime: '17:00' },
    friday: { available: false, startTime: '09:00', endTime: '17:00' },
    saturday: { available: false, startTime: '09:00', endTime: '17:00' },
    sunday: { available: false, startTime: '09:00', endTime: '17:00' }
  })
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [newBlockedDate, setNewBlockedDate] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/profile')
    }
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (user?.vatNumber) {
      setVatNumber(user.vatNumber)
    }
    
    // Populate professional data
    if (user?.role === 'professional') {
      if (user.businessInfo) {
        setBusinessInfo(prev => ({
          ...prev,
          ...user.businessInfo
        }))
      }
      if (user.hourlyRate) setHourlyRate(user.hourlyRate.toString())
      if (user.currency) setCurrency(user.currency)
      if (user.serviceCategories) setServiceCategories(user.serviceCategories)
      if (user.availability) setAvailability(prev => ({ ...prev, ...user.availability }))
      if (user.blockedDates) setBlockedDates(user.blockedDates)
    }
  }, [user])

  const handleVatNumberChange = (value: string) => {
    setVatNumber(value)
    setVatValidation({}) // Reset validation when user types
  }

  const validateVatNumber = async () => {
    if (!vatNumber.trim()) {
      setVatValidation({})
      return
    }

    const formatted = formatVATNumber(vatNumber)
    
    // Client-side format validation
    const formatValidation = validateVATFormat(formatted)
    if (!formatValidation.valid) {
      setVatValidation({
        valid: false,
        error: formatValidation.error
      })
      return
    }

    // If it's not an EU VAT number, just validate format
    if (!isEUVatNumber(formatted)) {
      setVatValidation({
        valid: false,
        error: 'Only EU VAT numbers can be validated with VIES'
      })
      return
    }

    // API validation for EU VAT numbers
    setVatValidating(true)
    try {
      const result = await validateVATWithAPI(formatted)
      setVatValidation({
        valid: result.valid,
        error: result.error,
        companyName: result.companyName,
        companyAddress: result.companyAddress
      })
    } catch (error) {
      setVatValidation({
        valid: false,
        error: 'Failed to validate VAT number'
      })
    } finally {
      setVatValidating(false)
    }
  }

  const saveVatNumber = async () => {
    if (!user) return

    setVatSaving(true)
    try {
      const result = await updateUserVAT(vatNumber)
      
      if (result.success) {
        toast.success(vatNumber ? 'VAT number updated successfully' : 'VAT number removed successfully')
        // Refresh user data
        await checkAuth()
        setVatValidation({})
      } else {
        toast.error(result.error || 'Failed to update VAT number')
      }
    } catch (error) {
      toast.error('Failed to update VAT number')
    } finally {
      setVatSaving(false)
    }
  }

  const removeVatNumber = async () => {
    setVatNumber('')
    setVatValidation({})
    setVatSaving(true)
    try {
      const result = await updateUserVAT('')
      
      if (result.success) {
        toast.success('VAT number removed successfully')
        await checkAuth()
      } else {
        toast.error(result.error || 'Failed to remove VAT number')
      }
    } catch (error) {
      toast.error('Failed to remove VAT number')
    } finally {
      setVatSaving(false)
    }
  }

  // Professional profile handlers
  const handleIdProofUpload = async () => {
    if (!idProofFile) return

    const formData = new FormData()
    formData.append('idProof', idProofFile)

    setUploading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/id-proof`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('ID proof uploaded successfully')
        setIdProofFile(null)
        await checkAuth() // Refresh user data
      } else {
        toast.error(result.msg || 'Failed to upload ID proof')
      }
    } catch (error) {
      toast.error('Failed to upload ID proof')
    } finally {
      setUploading(false)
    }
  }

  const saveBusinessInfo = async () => {
    setProfileSaving(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/professional-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          businessInfo,
          hourlyRate: parseFloat(hourlyRate) || 0,
          currency,
          serviceCategories,
          availability,
          blockedDates
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('Professional profile updated successfully')
        await checkAuth() // Refresh user data
      } else {
        toast.error(result.msg || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setProfileSaving(false)
    }
  }

  const handleServiceCategoryToggle = (category: string) => {
    setServiceCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const updateAvailability = (day: string, field: string, value: boolean | string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value
      }
    }))
  }

  const addBlockedDate = () => {
    if (!newBlockedDate) return
    
    const selectedDate = new Date(newBlockedDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (selectedDate < today) {
      toast.error('Cannot block dates in the past')
      return
    }
    
    if (blockedDates.includes(newBlockedDate)) {
      toast.error('Date is already blocked')
      return
    }
    
    setBlockedDates(prev => [...prev, newBlockedDate].sort())
    setNewBlockedDate('')
    toast.success('Blocked date added')
  }

  const removeBlockedDate = (dateToRemove: string) => {
    setBlockedDates(prev => prev.filter(date => date !== dateToRemove))
    toast.success('Blocked date removed')
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

  if (!isAuthenticated) {
    return null
  }

  const hasVatChanges = vatNumber !== (user?.vatNumber || '')
  const canValidate = vatNumber.trim() && vatNumber !== (user?.vatNumber || '')

  const serviceOptions = [
    'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Cleaning', 
    'IT Support', 'Home Repair', 'Gardening', 'Moving', 'Tutoring'
  ]

  const isProfessional = user?.role === 'professional'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto pt-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and settings</p>
          {isProfessional && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Professional Status: {user?.professionalStatus || 'pending'}
                </span>
              </div>
            </div>
          )}
        </div>

        {isProfessional ? (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="business">Business Info</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{user?.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="text-sm capitalize">{user?.role}</span>
              </div>
            </CardContent>
          </Card>

          {/* Verification Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Verification Status
              </CardTitle>
              <CardDescription>Account verification progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Verification</span>
                <span className={`text-sm font-medium ${user?.isEmailVerified ? 'text-green-600' : 'text-red-600'}`}>
                  {user?.isEmailVerified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Phone Verification</span>
                <span className={`text-sm font-medium ${user?.isPhoneVerified ? 'text-green-600' : 'text-red-600'}`}>
                  {user?.isPhoneVerified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
              {(user?.role === 'professional' || user?.role === 'customer') && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">VAT Verification</span>
                  <span className={`text-sm font-medium ${user?.isVatVerified ? 'text-green-600' : 'text-red-600'}`}>
                    {user?.isVatVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* VAT Number Card - For professionals and customers */}
          {(user?.role === 'professional' || user?.role === 'customer') && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  VAT Information
                </CardTitle>
                <CardDescription>
                  Add your VAT number for EU tax compliance. EU VAT numbers will be verified using VIES.
                  {user?.role === 'customer' && ' Useful for business customers who need VAT invoices.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">VAT Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="vatNumber"
                      placeholder="e.g., DE123456789"
                      value={vatNumber}
                      onChange={(e) => handleVatNumberChange(e.target.value.toUpperCase())}
                      className="flex-1"
                    />
                    <Button 
                      onClick={validateVatNumber}
                      disabled={!canValidate || vatValidating}
                      variant="outline"
                      className="shrink-0"
                    >
                      {vatValidating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Validating
                        </>
                      ) : (
                        'Validate'
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Format: 2-letter country code + 4-15 characters (e.g., DE123456789, FR12345678901)
                  </p>
                </div>

                {/* Validation Results */}
                {vatValidation.valid !== undefined && (
                  <div className={`p-3 rounded-lg border ${
                    vatValidation.valid 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      {vatValidation.valid ? (
                        <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1 text-sm">
                        {vatValidation.valid ? (
                          <div>
                            <p className="font-medium text-green-800">VAT number is valid</p>
                            {isEUVatNumber(vatNumber) && (
                              <p className="text-green-700">
                                Country: {getVATCountryName(vatNumber)}
                              </p>
                            )}
                            {vatValidation.companyName && (
                              <p className="text-green-700 mt-1">
                                <span className="font-medium">Company:</span> {vatValidation.companyName}
                              </p>
                            )}
                            {vatValidation.companyAddress && (
                              <p className="text-green-700">
                                <span className="font-medium">Address:</span> {vatValidation.companyAddress}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-red-800">Validation failed</p>
                            {vatValidation.error && (
                              <p className="text-red-700">{vatValidation.error}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Current VAT Status */}
                {user?.vatNumber && (
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="flex-1 text-sm">
                        <p className="font-medium text-blue-800">Current VAT Number</p>
                        <p className="text-blue-700">
                          {user.vatNumber} ({getVATCountryName(user.vatNumber)})
                        </p>
                        <p className="text-blue-700">
                          Status: {user.isVatVerified ? 'Verified' : 'Not Verified'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button 
                    onClick={saveVatNumber}
                    disabled={!hasVatChanges || vatSaving}
                    className="flex-1"
                  >
                    {vatSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      vatNumber ? 'Save VAT Number' : 'Remove VAT Number'
                    )}
                  </Button>
                  {user?.vatNumber && (
                    <Button 
                      onClick={removeVatNumber}
                      disabled={vatSaving}
                      variant="outline"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Stats */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Account Stats
              </CardTitle>
              <CardDescription>Your account activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Member Since</span>
                <span className="text-sm font-medium">
                  {new Date(user?.createdAt || '').toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Updated</span>
                <span className="text-sm font-medium">
                  {new Date(user?.updatedAt || '').toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
            </TabsContent>

            {/* Business Info Tab */}
            <TabsContent value="business" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Business Information
                  </CardTitle>
                  <CardDescription>
                    Complete your business profile to attract more clients
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={businessInfo.companyName}
                        onChange={(e) => setBusinessInfo(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="Your business name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={businessInfo.website}
                        onChange={(e) => setBusinessInfo(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Business Description</Label>
                    <Textarea
                      id="description"
                      value={businessInfo.description}
                      onChange={(e) => setBusinessInfo(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your business and services..."
                      rows={3}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={businessInfo.city}
                        onChange={(e) => setBusinessInfo(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={businessInfo.country}
                        onChange={(e) => setBusinessInfo(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="Country"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={businessInfo.postalCode}
                        onChange={(e) => setBusinessInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                        placeholder="Postal Code"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={businessInfo.address}
                      onChange={(e) => setBusinessInfo(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Full business address"
                    />
                  </div>

                  {/* Hourly Rate */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate">Hourly Rate</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        placeholder="50"
                        min="0"
                        max="10000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="CAD">CAD (C$)</SelectItem>
                          <SelectItem value="AUD">AUD (A$)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Service Categories */}
                  <div className="space-y-2">
                    <Label>Service Categories</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {serviceOptions.map((service) => (
                        <Button
                          key={service}
                          type="button"
                          variant={serviceCategories.includes(service) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleServiceCategoryToggle(service)}
                        >
                          {service}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={saveBusinessInfo}
                    disabled={profileSaving}
                    className="w-full"
                  >
                    {profileSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Business Information'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Identity Documents
                  </CardTitle>
                  <CardDescription>
                    Upload your ID proof for verification. Required for professional approval.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current ID Status */}
                  {user?.idProofUrl && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="flex-1 text-sm">
                          <p className="font-medium text-green-800">ID Proof Uploaded</p>
                          <p className="text-green-700">
                            Verification Status: {user.isIdVerified ? 'Verified' : 'Pending Review'}
                          </p>
                          <p className="text-green-700 text-xs">
                            Uploaded: {new Date(user.idProofUploadedAt || '').toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="idProof">Upload New ID Proof</Label>
                    <Input
                      id="idProof"
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => setIdProofFile(e.target.files?.[0] || null)}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500">
                      Accepted formats: JPEG, PNG, PDF. Maximum size: 5MB
                    </p>
                  </div>

                  {idProofFile && (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Selected: {idProofFile.name}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleIdProofUpload}
                    disabled={!idProofFile || uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload ID Proof
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Availability Tab */}
            <TabsContent value="availability" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Weekly Availability
                  </CardTitle>
                  <CardDescription>
                    Set your working hours for each day of the week
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(availability).map(([day, schedule]) => (
                    <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-20 text-sm font-medium capitalize">{day}</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={schedule.available}
                          onChange={(e) => updateAvailability(day, 'available', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">Available</span>
                      </div>
                      {schedule.available && (
                        <>
                          <Input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) => updateAvailability(day, 'startTime', e.target.value)}
                            className="w-32"
                          />
                          <span className="text-sm">to</span>
                          <Input
                            type="time"
                            value={schedule.endTime}
                            onChange={(e) => updateAvailability(day, 'endTime', e.target.value)}
                            className="w-32"
                          />
                        </>
                      )}
                    </div>
                  ))}
                  
                  <Button 
                    onClick={saveBusinessInfo}
                    disabled={profileSaving}
                    className="w-full mt-6"
                  >
                    {profileSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Availability'
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Blocked Dates Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarX className="h-5 w-5" />
                    Blocked Dates
                  </CardTitle>
                  <CardDescription>
                    Block specific dates when you're not available for work
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add New Blocked Date */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="newBlockedDate">Select Date to Block</Label>
                      <Input
                        id="newBlockedDate"
                        type="date"
                        value={newBlockedDate}
                        onChange={(e) => setNewBlockedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={addBlockedDate}
                        disabled={!newBlockedDate}
                        variant="outline"
                      >
                        <CalendarX className="h-4 w-4 mr-2" />
                        Block Date
                      </Button>
                    </div>
                  </div>

                  {/* Current Blocked Dates */}
                  {blockedDates.length > 0 && (
                    <div className="space-y-2">
                      <Label>Currently Blocked Dates</Label>
                      <div className="grid gap-2">
                        {blockedDates.map((date) => (
                          <div key={date} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CalendarX className="h-4 w-4 text-red-600" />
                              <span className="text-sm font-medium text-red-800">
                                {new Date(date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <Button
                              onClick={() => removeBlockedDate(date)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-100"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {blockedDates.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CalendarX className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No blocked dates set</p>
                      <p className="text-xs">Add dates when you're not available for work</p>
                    </div>
                  )}

                  <Button 
                    onClick={saveBusinessInfo}
                    disabled={profileSaving}
                    className="w-full"
                  >
                    {profileSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Blocked Dates'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          // Non-professional users get the simplified view
          <div className="grid md:grid-cols-2 gap-6">
            {/* User Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{user?.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm capitalize">{user?.role}</span>
                </div>
              </CardContent>
            </Card>

            {/* Verification Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Verification Status
                </CardTitle>
                <CardDescription>Account verification progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email Verification</span>
                  <span className={`text-sm font-medium ${user?.isEmailVerified ? 'text-green-600' : 'text-red-600'}`}>
                    {user?.isEmailVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Phone Verification</span>
                  <span className={`text-sm font-medium ${user?.isPhoneVerified ? 'text-green-600' : 'text-red-600'}`}>
                    {user?.isPhoneVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="mt-8">
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}