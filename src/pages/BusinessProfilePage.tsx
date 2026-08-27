import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { SkeletonTable } from '@/components/common/Skeleton'
import type { BusinessProfile } from '@/types'
import {
  getBusinessProfile,
  upsertBusinessProfile,
  uploadLogo,
  deleteLogo,
  getLogoUrl,
} from '@/services/businessProfileService'
import { Building2, Upload, Trash2, Globe, Mail, Phone, MapPin, FileCheck, Save } from 'lucide-react'

const schema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('Invalid URL format').optional().or(z.literal('')),
  tax_number: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function BusinessProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (user) {
      loadProfile(user.id)
    }
  }, [user])

  const loadProfile = async (userId: string) => {
    try {
      const data = await getBusinessProfile(userId)
      if (data) {
        setProfile(data)
        reset({
          business_name: data.business_name || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || '',
          postal_code: data.postal_code || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          tax_number: data.tax_number || '',
        })
        if (data.logo_path) {
          const url = await getLogoUrl(data.logo_path)
          setLogoPreview(url)
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load business profile')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!user) return
    setSaving(true)
    try {
      const updated = await upsertBusinessProfile(user.id, data as any)
      setProfile(updated)
      toast.success('Business profile saved successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save business profile')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, SVG)')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be under 2MB')
      return
    }

    try {
      if (profile?.logo_path) {
        await deleteLogo(profile.logo_path)
      }
      const path = await uploadLogo(user.id, file)
      const updated = await upsertBusinessProfile(user.id, { logo_path: path })
      setProfile(updated)
      const url = await getLogoUrl(path)
      setLogoPreview(url)
      toast.success('Logo uploaded successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload logo')
    }
  }

  const handleRemoveLogo = async () => {
    if (!profile?.logo_path || !user) return
    try {
      await deleteLogo(profile.logo_path)
      const updated = await upsertBusinessProfile(user.id, { logo_path: null })
      setProfile(updated)
      setLogoPreview(null)
      toast.success('Logo removed')
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove logo')
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="h-7 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <SkeletonTable rows={4} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Set up your business identity, branding logo, address, and tax info to pre-fill future invoices.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Logo & Identity */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Company Identity & Logo</h2>
              <p className="text-xs text-slate-500">Your logo will appear on exported PDF invoices.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Logo Avatar Box */}
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative group">
              {logoPreview ? (
                <img src={logoPreview} alt="Business Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <Building2 className="w-8 h-8 text-slate-300" />
              )}
            </div>

            {/* Upload Buttons */}
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<Upload className="w-3.5 h-3.5" />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload New Logo
                </Button>
                {profile?.logo_path && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    onClick={handleRemoveLogo}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Recommended: Square PNG, JPG or SVG, max size 2MB.
              </p>
            </div>
          </div>

          <Input
            label="Business / Company Name *"
            {...register('business_name')}
            error={errors.business_name?.message}
            placeholder="e.g. Acme Creative Agency"
          />
        </div>

        {/* Section 2: Contact Details */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Contact Information</h2>
              <p className="text-xs text-slate-500">Contact info displayed on invoices.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Business Email"
              type="email"
              icon={<Mail className="w-4 h-4" />}
              {...register('email')}
              error={errors.email?.message}
              placeholder="billing@yourcompany.com"
            />
            <Input
              label="Phone Number"
              icon={<Phone className="w-4 h-4" />}
              {...register('phone')}
              placeholder="+91 98765 43210"
            />
          </div>

          <Input
            label="Website URL"
            icon={<Globe className="w-4 h-4" />}
            {...register('website')}
            error={errors.website?.message}
            placeholder="https://yourcompany.com"
          />
        </div>

        {/* Section 3: Address & Tax info */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Address & Tax Details</h2>
              <p className="text-xs text-slate-500">Official business location and registration numbers.</p>
            </div>
          </div>

          <Input
            label="Street Address"
            {...register('address')}
            placeholder="Suite 500, Tech Park, MG Road"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input label="City" {...register('city')} placeholder="Bengaluru" />
            <Input label="State" {...register('state')} placeholder="Karnataka" />
            <Input label="Postal Code" {...register('postal_code')} placeholder="560001" />
            <Input label="Country" {...register('country')} placeholder="India" />
          </div>

          <Input
            label="GSTIN / Tax Registration Number"
            icon={<FileCheck className="w-4 h-4" />}
            {...register('tax_number')}
            placeholder="e.g. 29ABCDE1234F1Z5"
          />
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            loading={saving}
            size="lg"
            icon={<Save className="w-4 h-4" />}
            className="w-full sm:w-auto shadow-md"
          >
            Save Business Profile
          </Button>
        </div>
      </form>
    </div>
  )
}
