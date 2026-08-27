import { supabase } from '@/lib/supabase'
import type { BusinessProfile } from '@/types'

export async function getBusinessProfile(userId: string) {
  const { data, error } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  return data as BusinessProfile | null
}

export async function upsertBusinessProfile(userId: string, profile: Partial<BusinessProfile>) {
  const { data, error } = await supabase
    .from('business_profiles')
    .upsert({ user_id: userId, ...profile })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as BusinessProfile
}

export async function uploadLogo(userId: string, file: File) {
  const fileExt = file.name.split('.').pop()
  const filePath = `${userId}/${Date.now()}.${fileExt}`
  const { error } = await supabase.storage
    .from('business-logos')
    .upload(filePath, file, { upsert: true })
  if (error) throw new Error(error.message)
  return filePath
}

export async function getLogoUrl(path: string) {
  const { data } = supabase.storage.from('business-logos').getPublicUrl(path)
  return data.publicUrl
}

export async function deleteLogo(path: string) {
  const { error } = await supabase.storage.from('business-logos').remove([path])
  if (error) throw new Error(error.message)
}
