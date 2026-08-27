import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Loading } from '@/components/common/Loading'
import type { BusinessProfile } from '@/types'
import { getBusinessProfile, upsertBusinessProfile, uploadLogo, deleteLogo, getLogoUrl } from '@/services/businessProfileService'

const schema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  tax_number: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function BusinessProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const data = await getBusinessProfile(user.id)
    if (data) {
      setProfile(data)
      reset({
        business_name: data.business_name,
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
      if (profile?.logo_path) {
        const url = await getLogoUrl(profile.logo_path)
        setLogoPreview(url)
      }
      if (profile?.logo_path) {
        const url = await getLogoUrl(profile.logo_path)
        setLogoPreview(url)
      }
    }
    setLoading(false)
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const updated = await upsertBusinessProfile(user.id, data as any)
      setProfile(updated)
      toast.success('Business profile updated')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB')
      return
    }
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      if (profile?.logo_path) await deleteLogo(profile.logo_path)
      const path = await uploadLogo(user.id, file)
      const updated = await upsertBusinessProfile(user.id, { logo_path: path })
      setProfile(updated)
      const url = await getLogoUrl(path)
      setLogoPreview(url)
      toast.success('Logo uploaded')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (loading) return <Loading text="Loading business profile..." />

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Business Profile</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m3.182-5.159l5.159-5.159m0 0L21.75 9.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              )}
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                Upload Logo
              </Button>
              {profile?.logo_path && (
                <button type="button" onClick={async () => { await deleteLogo(profile.logo_path!); setLogoPreview(null); setProfile({ ...profile, logo_path: null }) }} className="ml-2 text-sm text-red-600 hover:text-red-800">
                  Remove
                </button>
              )}
            </div>
          </div>
          <Input label="Business Name" {...register('business_name')} error={errors.business_name?.message} />
          <Input label="Address" {...register('address')} error={errors.address?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" {...register('city')} error={errors.city?.message} />
            <Input label="State" {...register('state')} error={errors.state?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Country" {...register('country')} error={errors.country?.message} />
            <Input label="Postal Code" {...register('postal_code')} error={errors.postal_code?.message} />
          </div>
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
          <Input label="Website" {...register('website')} error={errors.website?.message} />
          <Input label="Tax Number" {...register('tax_number')} error={errors.tax_number?.message} />
        </div>
        <Button type="submit" loading={saving} className="w-full">Save Business Profile</Button>
      </form>
    </div>
  )
}
