import { supabase } from '@/lib/supabase'

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateProfile(userId: string, updates: { full_name?: string }) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}
